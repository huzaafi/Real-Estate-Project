//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IERC721 {
    function transferFrom(
        address _from,
        address _to,
        uint256 _id
    ) external;
}


contract Escrow {

    address public nftAddress;
    address payable public seller;
    address public lender;
    address public inspector;

    constructor (
        address _nftAddress, 
        address payable _seller, 
        address _lender, 
        address _inspector
    ) {
        nftAddress = _nftAddress;
        seller = _seller;
        lender = _lender;
        inspector = _inspector;
    }


    modifier onlySeller{
        require(msg.sender == seller, "Only Seller can Perform this funcion");
        _;
    }

    modifier onlyBuyer(uint _nftId) {
        require(msg.sender == buyer[_nftId], "Only buyer can perform this function");
        _;
    }

    modifier onlyInspector () {
        require(msg.sender == inspector, "Only Inspector can perform this function");
        _;
    }   

    mapping (uint => bool) public isListed;
    mapping (uint => uint) public purchasePrice;
    mapping (uint => uint) public escrowPrice;
    mapping (uint => address) public buyer;
    mapping (uint => bool) public inspection;
    mapping (uint => mapping(address => bool)) public approve;

    // Only Seller can list the NFT
    function list(uint _nftID, address _buyer, uint _purchasePrice, uint _escrowPrice) public payable onlySeller {
        // Transfer NFT form Seller to This Contract.
        IERC721(nftAddress).transferFrom(msg.sender, address(this), _nftID);

        isListed[_nftID] = true;
        buyer[_nftID] = _buyer;
        purchasePrice[_nftID] = _purchasePrice;
        escrowPrice[_nftID] = _escrowPrice;
    }

    // Buyer Deposit NFTs Escrow Amount to the contract
    function depositEarnest(uint _nftID ) public payable {
        require(msg.value == escrowPrice[_nftID], "Depost Amount is not enough");
    }

    // Buyer Deposit Ethers to the contract
    function updateInspectionStatus(uint _nftID, bool _passed) public onlyInspector {
        inspection[_nftID] = _passed;
    }

    // Approve for Sale
    function approveSale(uint _nftID) public {
        approve[_nftID][msg.sender] = true;
    }

    // Finalize Sale
    // -> Require inspection status (add more items here, like appraisal)
    // -> Require sale to be authorized
    // -> Require funds to be correct amount
    // -> Transfer NFT to buyer
    // -> Transfer Funds to Seller
    function finalizeSale(uint _nftID) public {
        require(inspection[_nftID], "Inspection Not Passed");
        require(approve[_nftID][seller], "Seller Not Approve");
        require(approve[_nftID][buyer[_nftID]], "Buyer Not Approve");
        require(approve[_nftID][lender], "Lender Not Approve");

        require(address(this).balance >= purchasePrice[_nftID]);

        isListed[_nftID] = false;
        (bool success, ) = payable(seller).call{value: address(this).balance} ("");
        require(success, "Ether transfer to seller failed");

        IERC721(nftAddress).transferFrom(address(this), buyer[_nftID], _nftID);
    }

    receive() external payable {}

    function getBalance() public view returns(uint) {
        return address(this).balance;
    }

}