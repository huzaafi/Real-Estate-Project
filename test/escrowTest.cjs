const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether');
}

describe('Escrow', () => {
    let seller, buyer, lender, inspector;
    let realState, escrow;
    let purchasePrice = tokens(10);
    let escrowPrice = tokens(5);

    beforeEach(async () => {
        [seller, buyer, lender, inspector] = await ethers.getSigners();
        
        // Deploy Real State Contract
        const RealState = await ethers.getContractFactory("RealEstate");
        realState = await RealState.deploy()

        // Mint 
        let transaction = await realState.connect(seller).mint("https://ik.imagekit.io/huzaafi/1.jpg?updatedAt=1699082991136");
        await transaction.wait();

        // Deploy Escrow Contract
        const Escrow = await ethers.getContractFactory("Escrow");
        escrow = await Escrow.deploy(realState.address, seller.address, lender.address, inspector.address);

        // Approve
        await realState.connect(seller).approve(escrow.address, 1)
        await escrow.connect(seller).list(1, buyer.address, purchasePrice, escrowPrice);
    });

    describe("Deployment", () => {
        it("Should Retur NFT address", async () => {
            expect(await escrow.nftAddress()).to.equal(realState.address);
        });
        it("Should Retur Seller address", async () => {
            expect(await escrow.seller()).to.equal(seller.address);
        });
        it("Should Retur Lender address", async () => {
            expect(await escrow.lender()).to.equal(lender.address);
        });
        it("Should Retur Inspector address", async () => {
            expect(await escrow.inspector()).to.equal(inspector.address);
        }); 
    });

    describe("Listing", () => {
        it("Should List the NFT", async () => {
            const result = await escrow.isListed(1)
            expect(result).to.equal(true);
        });

        it("Should Return Buyer Address", async () => {
            const result = await escrow.buyer(1)
            expect(result).to.equal(buyer.address);
        });

        it("Should Return the Purchase Price", async () => {
            const result = await escrow.purchasePrice(1);
            expect(result.toString()).to.equal(purchasePrice.toString());
        });

        it("Should Return the Escrow Price ", async () => {
            const result = await escrow.escrowPrice(1)
            expect(result.toString()).to.equal(escrowPrice.toString());
        });
        
        it("Should Update the NFT Ownership", async () => {
            expect(await realState.ownerOf(1)).to.equal(escrow.address);
        })
    });

    describe("Deposit", () => {
        it("Should Update the Contract Balance", async () => {
            await escrow.connect(buyer).depositEarnest(1, {value: escrowPrice})
            const result = await escrow.getBalance()
            expect(result.toString()).to.equal(escrowPrice.toString());
        });
    });

    describe("Inspection", () => {
        beforeEach(async () => {
            const transaction = await escrow.connect(inspector).updateInspectionStatus(1, true);
            await transaction.wait();
        });

        it("Should Update the Inspection Status", async () => {
            const result = await escrow.inspection(1);
            expect(result).to.equal(true);
        });
    });

    describe("Approval", () => {
        beforeEach(async () => {
            let transaction = await escrow.connect(seller).approveSale(1);
            await transaction.wait();
            transaction = await escrow.connect(buyer).approveSale(1);
            await transaction.wait();
            transaction = await escrow.connect(lender).approveSale(1);
            await transaction.wait();
        });

        it("Should Update the Approval Status", async () => {
            expect(await escrow.approve(1, seller.address)).to.equal(true);
            expect(await escrow.approve(1, buyer.address)).to.equal(true);
            expect(await escrow.approve(1, lender.address)).to.equal(true);
        });
    });

    describe("Finalize Sale", () => {
        beforeEach(async () => {
            let transaction = await escrow.connect(buyer).depositEarnest(1, {value: escrowPrice});
            await transaction.wait();
            expect((await escrow.getBalance()).toString()).to.equal(escrowPrice.toString());

            transaction = await escrow.connect(inspector).updateInspectionStatus(1, true);
            await transaction.wait();

            transaction = await escrow.connect(seller).approveSale(1);
            await transaction.wait();

            transaction = await escrow.connect(buyer).approveSale(1);
            await transaction.wait();

            transaction = await escrow.connect(lender).approveSale(1);
            await transaction.wait();

            transaction = await lender.sendTransaction({to: escrow.address, value: tokens(5)});
    
            expect((await escrow.getBalance()).toString()).to.equal(purchasePrice.toString());

            await escrow.connect(seller).finalizeSale(1);
        });

        it("Should Check the Approval Status of all", async () => {
            expect(await escrow.approve(1, seller.address)).to.equal(true);
            expect(await escrow.approve(1, buyer.address)).to.equal(true);
            expect(await escrow.approve(1, lender.address)).to.equal(true);
            expect(await escrow.inspection(1)).to.equal(true);
        });

        it("Should Update the Contract Balance", async () => {
            const result = await escrow.getBalance()
            expect(result.toString()).to.equal('0');
        });

        it("Should Update the NFT Ownership", async () => {
            expect(await realState.ownerOf(1)).to.equal(buyer.address);
        });
    });
});
