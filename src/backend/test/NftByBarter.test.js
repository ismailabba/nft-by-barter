const { expect } = require("chai")
const { ethers } = require("hardhat")

const toWei = (num) => ethers.utils.parseEther(num.toString())
const fromWei = (num) => ethers.utils.formatEther(num)

describe("NftByBarter", function() {
    let deployer, addr1, addr2, nft, marketplace, addrs
    let feePercent = 1;
    let URI = "Sample URI"
    let URI1 = "Sample URI1"
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
            await expect(nftbybarter.connect(addr1).listSwapItem(nft.address, 1, toWei(2)))
              .to.emit(nftbybarter, "OfferedSwap")
              .withArgs(1,nft.address,1,toWei(2), addr1.address)

              //owner of NFT should now be the marketplace
              expect(await nft.ownerOf(1)).to.equal(nftbybarter.address);

              //item count should equal 1
              expect(await nftbybarter.itemCount()).to.equal(1)

              //get iten from items mappping then check fields to ensure they re correct
              const item = await nftbybarter.swapitems(1);
              expect(item.itemId).to.equal(1);
              expect(item.nft).to.equal(nft.address);
              expect(item.tokenId).to.equal(1);
              expect(item.price).to.equal(toWei(2));
              expect(item.swapped).to.equal(false);


        });


        it("it should fail if price is set to zero", async function() {
            await expect(nftbybarter.connect(addr1).listSwapItem(nft.address, 1, 0)).to.be.revertedWith("Price must be greater than zero")
        })
    });


    describe("Swapping items", function () {
      let price = 2
      let fee = (feePercent/100)*price
      let totalPriceInWei
      beforeEach(async function () {
        // addr1 mints an nft
        await nft.connect(addr1).mint(URI)
        // addr1 approves marketplace to spend tokens
        await nft.connect(addr1).setApprovalForAll(nftbybarter.address, true)
        // addr1 makes their nft a marketplace item.
        await nftbybarter.connect(addr1).listSwapItem(nft.address, 1 , toWei(price))

         // addr1 mints an nft
         await nft.connect(addr2).mint(URI)
         // addr1 approves marketplace to spend tokens
         await nft.connect(addr2).setApprovalForAll(nftbybarter.address, true)
         // addr1 makes their nft a marketplace item.
         await nftbybarter.connect(addr2).listSwapItem(nft.address, 2 , toWei(price))
 
         

        


      })
      it("Should update item as sold, swap items, charge fees and emit a swapped event", async function () {
        //const sellerInitalEthBal = await addr1.getBalance()
        const feeAccountInitialEthBal = await deployer.getBalance()
        // fetch items total price (market fees + item price)
        totalPriceInWei = await nftbybarter.getTotalPrice(1);
        // addr 2 purchases item.
        await expect(nftbybarter.connect(addr2).swapItem(1, 2, {value: (totalPriceInWei)}))
        .to.emit(nftbybarter, "SwappedOne")
          .withArgs(1, nft.address, 1, toWei(price), addr1.address )

        //const sellerFinalEthBal = await addr1.getBalance()
        const feeAccountFinalEthBal = await deployer.getBalance()
        // Item should be marked as swapped
        expect((await nftbybarter.swapitems(1)).swapped).to.equal(true)
        expect((await nftbybarter.swapitems(2)).swapped).to.equal(true)

        // Seller should receive payment for the price of the NFT sold.
        //expect(+fromWei(sellerFinalEthBal)).to.equal(+price + +fromWei(sellerInitalEthBal))
        // feeAccount should receive fee
        //expect(+fromWei(feeAccountFinalEthBal)).to.equal(+fee + +fromWei(feeAccountInitialEthBal))
        // The buyer should now own the nft
        expect(await nft.ownerOf(1)).to.equal(addr2.address);
        expect(await nft.ownerOf(2)).to.equal(addr1.address);
      })
      // it("Should fail for invalid item ids, sold items and when not enough ether is paid", async function () {
      //   // fails for invalid item ids
      //   await expect(
      //     marketplace.connect(addr2).purchaseItem(2, {value: totalPriceInWei})
      //   ).to.be.revertedWith("item doesn't exist");
      //   await expect(
      //     marketplace.connect(addr2).purchaseItem(0, {value: totalPriceInWei})
      //   ).to.be.revertedWith("item doesn't exist");
      //   // Fails when not enough ether is paid with the transaction. 
      //   // In this instance, fails when buyer only sends enough ether to cover the price of the nft
      //   // not the additional market fee.
      //   await expect(
      //     marketplace.connect(addr2).purchaseItem(1, {value: toWei(price)})
      //   ).to.be.revertedWith("not enough ether to cover item price and market fee"); 
      //   // addr2 purchases item 1
      //   await marketplace.connect(addr2).purchaseItem(1, {value: totalPriceInWei})
      //   // addr3 tries purchasing item 1 after its been sold 
      //   const addr3 = addrs[0]
      //   await expect(
      //     marketplace.connect(addr3).purchaseItem(1, {value: totalPriceInWei})
      //   ).to.be.revertedWith("item already sold");
        
      // });
    })
  
    
 
})