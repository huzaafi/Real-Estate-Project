

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether');
}

async function main() {
  [seller, buyer, lender, inspector] = await ethers.getSigners();

  const RealEstate = await ethers.getContractFactory("RealEstate");
  const realEstate = await RealEstate.deploy();
  await realEstate.deployed();

  console.log("Deployed Real State Contract At: ", realEstate.address);
  console.log("Minting NFTs");

  let transaction = await realEstate.connect(seller).mint("https://ik.imagekit.io/huzaafi/1.json?updatedAt=1699382247993");
  transaction = await realEstate.connect(seller).mint("https://ik.imagekit.io/huzaafi/2.json?updatedAt=1699382248016");
  transaction = await realEstate.connect(seller).mint("https://ik.imagekit.io/huzaafi/3.json?updatedAt=1699382247985");
  console.log("NFTs Minting  Complete");

  const Escrow = await ethers.getContractFactory("Escrow");
  const escrow = await Escrow.deploy(realEstate.address, seller.address, lender.address, inspector.address);
  await escrow.deployed();
  console.log("Deployed Escrow Contract At:", escrow.address)

  for(i=0; i<3; i++) {
    let transaction = await realEstate.connect(seller).approve(escrow.address, i + 1);
    await transaction.wait();
  }

  console.log("NFTs Approve for Escrow Contract");

  transaction = await escrow.connect(seller).list(1, buyer.address, tokens(10), tokens(5)); 
  transaction = await escrow.connect(seller).list(2, buyer.address, tokens(15), tokens(7));
  transaction = await escrow.connect(seller).list(3, buyer.address, tokens(20), tokens(10));

  console.log("Finish Deploying")

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});