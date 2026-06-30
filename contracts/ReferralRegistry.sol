// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ReferralRegistry
 * @notice Standalone, reusable referral registry for the Opus Ecosystem.
 *         Designed to be shared across protocol modules (Oath Vault,
 *         Probability Shop, and any future module) so that a user's referrer
 *         is recorded ONCE and honored everywhere.
 *
 * Responsibilities (on-chain source of truth):
 *   - Map human-readable names to wallets (name registry).
 *   - Permanently bind a user to the referrer that introduced them (immutable).
 *   - Provide the canonical fee-discount math: 20% invitee discount and a 40%
 *     total stacking cap, shared by every module that charges fees.
 *
 * What this contract intentionally does NOT do:
 *   - It does not hold funds or pay rewards. Reward accounting (the 10/70/20
 *     PLS split and the 12-month reward window) is performed by the individual
 *     fee-charging modules, which read bindings from here and emit/settle their
 *     own reward events. This keeps the registry small, auditable, and reusable.
 *
 * This is a reference design to deploy alongside the protocol contracts. The
 * off-chain Neon registry in the app mirrors this interface so the frontend can
 * operate before deployment and migrate cleanly afterwards.
 */
contract ReferralRegistry {
    /* --------------------------------- Types -------------------------------- */

    struct Binding {
        address referrer; // wallet that referred this user
        uint64 boundAt; // timestamp of binding (used for the 12-month window)
        bool exists;
    }

    /* ------------------------------- Constants ------------------------------ */

    /// @notice Discount applied to an invitee's protocol fees, in basis points.
    uint16 public constant INVITEE_DISCOUNT_BPS = 2000; // 20%

    /// @notice Maximum combined discount from all sources (referral + staking).
    uint16 public constant MAX_DISCOUNT_BPS = 4000; // 40%

    /// @notice Reward split (basis points). Enforced by fee-charging modules.
    uint16 public constant REFERRER_SHARE_BPS = 1000; // 10%
    uint16 public constant PROTOCOL_SHARE_BPS = 7000; // 70%
    uint16 public constant STAKER_SHARE_BPS = 2000; // 20%

    /// @notice Window during which a referrer earns from an invitee's activity.
    uint64 public constant REWARD_WINDOW = 365 days;

    uint8 public constant MIN_NAME_LEN = 3;
    uint8 public constant MAX_NAME_LEN = 20;

    /* -------------------------------- Storage ------------------------------- */

    address public owner;

    /// @notice name (lowercased) => wallet
    mapping(string => address) public nameToWallet;
    /// @notice wallet => its claimed name ("" if none)
    mapping(address => string) public walletToName;
    /// @notice user => immutable referrer binding
    mapping(address => Binding) public bindings;
    /// @notice referrer => number of users they have referred
    mapping(address => uint256) public referralCount;
    /// @notice modules authorized to record bindings on a user's behalf
    mapping(address => bool) public authorizedModules;

    /* -------------------------------- Events -------------------------------- */

    event NameRegistered(address indexed wallet, string name);
    event ReferrerBound(address indexed user, address indexed referrer, uint64 boundAt);
    event ModuleAuthorized(address indexed module, bool authorized);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /* ------------------------------- Modifiers ------------------------------ */

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    /* --------------------------- Admin / modules ---------------------------- */

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "zero owner");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    /// @notice Authorize a protocol module to bind referrers for users
    ///         (e.g. on a user's first interaction with that module).
    function setModuleAuthorization(address module, bool authorized) external onlyOwner {
        authorizedModules[module] = authorized;
        emit ModuleAuthorized(module, authorized);
    }

    /* ----------------------------- Name registry ---------------------------- */

    /**
     * @notice Claim a referral name for msg.sender. One name per wallet,
     *         names are unique and immutable once claimed.
     * @dev Validation matches the off-chain registry: 3-20 chars, lowercase
     *      a-z, 0-9, and '-'.
     */
    function registerName(string calldata name) external {
        require(_isValidName(name), "invalid name");
        require(nameToWallet[name] == address(0), "name taken");
        require(bytes(walletToName[msg.sender]).length == 0, "wallet has name");

        nameToWallet[name] = msg.sender;
        walletToName[msg.sender] = name;
        emit NameRegistered(msg.sender, name);
    }

    /* ------------------------------- Bindings ------------------------------- */

    /**
     * @notice Bind msg.sender to a referrer. Immutable: the first successful
     *         binding can never be changed or overwritten.
     */
    function bindReferrer(address referrer) external {
        _bind(msg.sender, referrer);
    }

    /// @notice Same as bindReferrer but using the referrer's registered name.
    function bindReferrerByName(string calldata name) external {
        address referrer = nameToWallet[name];
        require(referrer != address(0), "name not found");
        _bind(msg.sender, referrer);
    }

    /**
     * @notice Authorized modules may bind a user on their behalf the first time
     *         the user interacts (matching the off-chain "bind on first
     *         protocol interaction" flow). Still immutable — a no-op if bound.
     */
    function bindReferrerFor(address user, address referrer) external {
        require(authorizedModules[msg.sender], "not authorized");
        if (!bindings[user].exists) {
            _bind(user, referrer);
        }
    }

    function _bind(address user, address referrer) internal {
        require(!bindings[user].exists, "already bound");
        require(referrer != address(0), "zero referrer");
        require(referrer != user, "self referral");

        bindings[user] = Binding({referrer: referrer, boundAt: uint64(block.timestamp), exists: true});
        unchecked {
            referralCount[referrer] += 1;
        }
        emit ReferrerBound(user, referrer, uint64(block.timestamp));
    }

    /* ------------------------------- Views ---------------------------------- */

    function referrerOf(address user) external view returns (address) {
        return bindings[user].referrer;
    }

    /// @notice Whether `user` is still inside the reward window for their referrer.
    function isWithinRewardWindow(address user) public view returns (bool) {
        Binding memory b = bindings[user];
        if (!b.exists) return false;
        return block.timestamp <= uint256(b.boundAt) + REWARD_WINDOW;
    }

    /**
     * @notice Canonical discount helper for fee-charging modules.
     * @param user The wallet being charged a fee.
     * @param stakingDiscountBps Discount the caller computes from Smaug staking.
     * @return discountBps Combined discount, capped at MAX_DISCOUNT_BPS.
     * @dev The 20% invitee discount only applies while the user is bound and
     *      within the reward window.
     */
    function discountBpsFor(address user, uint16 stakingDiscountBps) external view returns (uint16 discountBps) {
        uint256 total = stakingDiscountBps;
        if (bindings[user].exists && isWithinRewardWindow(user)) {
            total += INVITEE_DISCOUNT_BPS;
        }
        if (total > MAX_DISCOUNT_BPS) {
            total = MAX_DISCOUNT_BPS;
        }
        return uint16(total);
    }

    /// @notice Apply the capped discount to a gross fee amount.
    function applyDiscount(uint256 grossFee, uint16 discountBps) external pure returns (uint256 netFee) {
        if (discountBps == 0) return grossFee;
        require(discountBps <= MAX_DISCOUNT_BPS, "discount too high");
        return grossFee - (grossFee * discountBps) / 10_000;
    }

    /* --------------------------- Name validation ---------------------------- */

    function _isValidName(string calldata name) internal pure returns (bool) {
        bytes memory b = bytes(name);
        if (b.length < MIN_NAME_LEN || b.length > MAX_NAME_LEN) return false;
        for (uint256 i = 0; i < b.length; i++) {
            bytes1 c = b[i];
            bool isLower = (c >= 0x61 && c <= 0x7A); // a-z
            bool isDigit = (c >= 0x30 && c <= 0x39); // 0-9
            bool isHyphen = (c == 0x2D); // '-'
            if (!(isLower || isDigit || isHyphen)) return false;
        }
        return true;
    }
}
