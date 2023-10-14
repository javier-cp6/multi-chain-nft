// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {IUniSwapV2Router02} from "./Interfaces.sol";

/// @custom:security-contact 
contract PublicSale is 
    Initializable, 
    ERC20Upgradeable, 
    ERC20PausableUpgradeable, 
    AccessControlUpgradeable, 
    UUPSUpgradeable 
{
    IERC20Upgradeable bbToken;
    IERC20 usdc;
    IUniSwapV2Router02 router;

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant EXECUTER_ROLE = keccak256("EXECUTER_ROLE");

    address constant UNISWAP_V2_ROUTER =
        0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;

    // 00 horas del 30 de septiembre del 2023 GMT
    uint256 constant startDate = 1696032000;

    // Maximo price NFT
    uint256 constant MAX_PRICE_NFT = 90_000 * 10 ** 18;

    // Mapping from token ID to owner address
    mapping(uint256 => address) private _owners;

    // Mapping owner address to token count
    mapping(address => uint256) private _balances;

    event PurchaseNftWithId(address account, uint256 id);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _bbToken, address _usdc) initializer public {
        __ERC20Pausable_init();
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);
        _grantRole(EXECUTER_ROLE, msg.sender);

        bbToken = IERC20Upgradeable(_bbToken);
        usdc = IERC20(_usdc);
        router = IUniSwapV2Router02(UNISWAP_V2_ROUTER);
    }

    function _getNftPrice(uint256 _id) internal view returns(uint256) {
        uint256 _price;
        if(_id >= 0 && _id <= 199) {
            _price = 1_000 * 10 ** decimals();
        }
        else if(_id >= 200 && _id <= 499) {
            _price = _id * 20 * 10 ** decimals();
        }
        else if(_id >= 500 && _id <= 699) {
            uint256 _basePrice = 10_000;
            uint256 _daysElapsed = (block.timestamp - startDate) / 86_400; 
            _price = (_basePrice + (_daysElapsed * 2_000)) * 10 ** decimals();
            _price = _price <= MAX_PRICE_NFT ? _price : MAX_PRICE_NFT;
        }
        else if(_id >= 700 && _id <= 999) {
            _price = 0.01 ether;
        }
        return _price;
    }

    function _getRandom700To999() internal view returns (uint256) {
        uint256 random = (uint256(
            keccak256(abi.encodePacked(block.timestamp, msg.sender))
        ) % 300) + 700;
        return random;
    }

    function purchaseWithTokens(uint256 _id) public {
        require(_id >= 0 && _id <= 699, "Invalid NFT ID");

        require(_owners[_id] == address(0), "Token already owned");

        uint256 _price = _getNftPrice(_id);
        require(bbToken.transferFrom(msg.sender, address(this), _price), "Token transfer failed");

        _owners[_id] = msg.sender;
        _balances[msg.sender] += 1;

        emit PurchaseNftWithId(msg.sender, _id);
    }

    function purchaseWithUSDC(uint256 _id, uint256 _amountIn) public {
        // transfiere _amountIn de USDC a este contrato
        // llama a swapTokensForExactTokens: valor de retorno de este metodo es cuanto gastaste del token input
        // transfiere el excedente de USDC a msg.sender
        require(_id >= 0 && _id <= 699, "Invalid NFT ID");

        require(_owners[_id] == address(0), "Token already owned");

        // receive usdc
        require(usdc.transferFrom(msg.sender, address(this), _amountIn), "USDC token transfer failed");

        // approve from PublicSale to Uniswap V2 Router
        usdc.approve(address(router), _amountIn);

        uint256 _price = _getNftPrice(_id);
        uint deadline = block.timestamp + 300;
        
        address[] memory path = new address[](2);
        path[0] = address(usdc);
        path[1] = address(bbToken);

        //swap USDC to BBTKN
        uint[] memory _amounts = router.swapTokensForExactTokens(
            _price,
            _amountIn,
            path,
            address(this),
            deadline
        );

        if (_amounts[0] < _amountIn) {
            require(usdc.transfer(msg.sender, _amountIn - _amounts[0]), "USDC Token transfer failed");
        }

        _owners[_id] = msg.sender;
        _balances[msg.sender] += 1;

        emit PurchaseNftWithId(msg.sender, _id);
    }

    function purchaseWithEtherAndId(uint256 _id) public payable {
        require(_id >= 700 && _id <= 999, "Invalid NFT ID");

        require(_owners[_id] == address(0), "Token already owned");

        uint256 _price = _getNftPrice(_id);

        require(msg.value == _price, "Insuffient ether");

        _owners[_id] = msg.sender;
        _balances[msg.sender] += 1;

        emit PurchaseNftWithId(msg.sender, _id);
    }

    function depositEthForARandomNft() public payable {
        uint256 _id = _getRandom700To999();

        require(_owners[_id] == address(0), "Token already owned");

        uint256 _price = _getNftPrice(_id);

        require(msg.value == _price, "Insuffient ether");

        _owners[_id] = msg.sender;
        _balances[msg.sender] += 1;

        emit PurchaseNftWithId(msg.sender, _id);
    }

    function ownerOf(uint256 _id) public view returns (address) {
        require(_owners[_id] != address(0), "Invalid token ID");
        return _owners[_id];
    }

    function nftBalanceOf(address _owner) public view returns (uint256) {
        require(_owner != address(0), "Address zero is not a valid owner");
        return _balances[_owner];
    }

    function getPriceForId(uint256 _nftId) public view returns(uint256) {
        require(_nftId >= 0 && _nftId <= 699, "Invalid NFT ID");

        require(_owners[_nftId] == address(0), "Token already owned");
        return _getNftPrice(_nftId);
    }

    receive() external payable {
        depositEthForARandomNft();
    }

    ////////////////////////////////////////////////////////////////////////
    /////////                    Helper Methods                    /////////
    ////////////////////////////////////////////////////////////////////////

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        onlyRole(UPGRADER_ROLE)
        override
    {}

    // The following functions are overrides required by Solidity.

    function _beforeTokenTransfer(
        address from, 
        address to, 
        uint256 value
    ) internal override(ERC20Upgradeable, ERC20PausableUpgradeable) whenNotPaused {
        super._beforeTokenTransfer(from, to, value);
    }

    ////////////////////////////////////////////////////////////////////////
    /////////                    Version                           /////////
    ////////////////////////////////////////////////////////////////////////

    function version() public pure returns (uint256) {
        return 18;
    }
}
