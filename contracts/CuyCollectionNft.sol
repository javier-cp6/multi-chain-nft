// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/// @custom:security-contact
contract CuyCollectionNft is
    Initializable,
    ERC721Upgradeable,
    PausableUpgradeable,
    AccessControlUpgradeable,
    ERC721BurnableUpgradeable,
    UUPSUpgradeable
{
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    bytes32 root;

    event Burn(address account, uint256 id);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }
    
    function initialize() initializer public {
        __ERC721_init("Cuy Collection NFT", "CUYNFT");
        __Pausable_init();
        __AccessControl_init();
        __ERC721Burnable_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);
    }
    // updated with metadata folder's CID
    function _baseURI() internal pure override returns (string memory) {
        return "ipfs://QmVNPCWFZR7vakxLt8jrVzAKmtVnj4xBt2ipLPmUT5ACpA/"; 
    }

    function safeMint(
        address to,
        uint256 tokenId
    ) public onlyRole(MINTER_ROLE) whenNotPaused {
        require(
            tokenId >= 0 && tokenId <= 999,
            "Token ID out of range"
        );
        require(!_exists(tokenId), "Token already owned");
        _safeMint(to, tokenId);
    }

    function safeMintWhiteList(
        address to,
        uint256 tokenId,
        bytes32[] calldata proofs
    ) public whenNotPaused {
        require(to == msg.sender, "Token recipient must be the same as the sender");

        require(
            tokenId >= 1000 && tokenId <= 1999,
            "Token ID out of range"
        );
        
        require(
            _verifyMerkleProof(_hashToken(to, tokenId), proofs),
            "Not authorized to mint token."
        );
        _safeMint(to, tokenId);
    }

    function buyBack(uint256 id) public {
        require(
            id >= 1000 && id <= 1999,
            "Token ID out of range"
        );
        require(
            _isApprovedOrOwner(_msgSender(), id),
            "Not token owner or approved"
        );
        _burn(id);

        emit Burn(_msgSender(), id);
    }

    ////////////////////////////////////////////////////////////////////////
    /////////                    Helper Methods                    /////////
    ////////////////////////////////////////////////////////////////////////
    function getRoot() public view onlyRole(UPGRADER_ROLE) returns (bytes32) {
        return root;
    }

    function setRoot(bytes32 _root) public onlyRole(UPGRADER_ROLE) {
        root = _root;
    }

    function _verifyMerkleProof(
        bytes32 leaf,
        bytes32[] memory proofs
    ) internal view returns (bool) {
        return MerkleProof.verify(proofs, root, leaf);
    }

    function _hashToken(
        address to,
        uint256 tokenId
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(tokenId, to));
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyRole(UPGRADER_ROLE) {}    

    // The following functions are overrides required by Solidity.
    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721Upgradeable, AccessControlUpgradeable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    ////////////////////////////////////////////////////////////////////////
    /////////                    Version                           /////////
    ////////////////////////////////////////////////////////////////////////

    function version() public pure returns (uint256) {
        return 2;
    }
}
