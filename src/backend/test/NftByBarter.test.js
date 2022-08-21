const { expect } = require("chai")
const { ethers } = require("hardhat")

const toWei = (num) => ethers.utils.parseEther(num.toString())
const fromWei = (num) => ethers.utils.formatEther(num)

describe("NftByBarter", function() {
    let deployer, addr1, addr2, nft, marketplace, addrs
    let feePercent = 1;
    let URI = "Sample URI"
    let URI1 = "Sample URI"
    beforeEach(async function(){
        
        const NFT = await ethers.getContractFactory("NFT");
        const NftByBarter= await ethers.getContractFactory("NftByBarter");
    
    
        //get signers
        [deployer, addr1, addr2, ...addrs] = await ethers.getSigners();

       
        nft = await NFT.deploy();
        nftbybarter = await NftByBarter.deploy(feePercent);
    });

    describe("deployment", function(){
      it("Should track name and symbol of the  nft collection", async function() {
        expect(await nft.name()).to.equal("Afro NFT")
        expect(await nft.symbol()).to.equal("AFRO")
      });
      
      it("Should track feeAccount and feepercent of nft by barter", async function() {
        expect(await nftbybarter.feeAccount()).to.equal(deployer.address);
        expect(await nftbybarter.feePercent()).to.equal(feePercent)
      });
    })

    

    describe("Listing swapping items", function () {
        beforeEach(async function(){
             //addr1 mints an nft
             await nft.connect(addr1).mint(URI)
             //addr1 approves nftbybarter to spend nft
             await nft.connect(addr1).setApprovalForAll(nftbybarter.address, true)

              //addr2 mints an nft
            // await nft.connect(addr2).mint(URI)
            // //addr2 approves nftbybarter to spend nft
            // await nft.connect(addr2).setApprovalForAll(nftbybarter.address, true)
        })
        it("it should track newly created item, transfer NFT from seller to nftbybarter and emit offered event", async function() {
            await expect(nftbybarter.connect(addr1).listSwapItem(nft.address, 1, toWei(1)))
              .to.emit(nftbybarter, "OfferedSwap")
              .withArgs(1,nft.address,1,toWei(1), addr1.address)

              //owner of NFT should now be the marketplace
              expect(await nft.ownerOf(1)).to.equal(nftbybarter.address);

              //item count should equal 1
              expect(await nftbybarter.itemCount()).to.equal(1)

              //get iten from items mappping then check fields to ensure they re correct
              const item = await nftbybarter.items(1);
              expect(item.itemId).to.equal(1);
              expect(item.nft).to.equal(nft.address);
              expect(item.tokenId).to.equal(1);
              expect(item.price).to.equal(toWei(1));
              expect(item.swapped).to.equal(false);


        });


        it("it should fail if price is set to zero", async function() {
            await expect(nftbybarter.connect(addr1).listSwapItem(nft.address, 1, 0)).to.be.revertedWith("Price must be greater than zero")
        })
    });
  
    
 
})