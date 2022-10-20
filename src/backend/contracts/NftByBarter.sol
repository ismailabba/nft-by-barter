//SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

//interface calls externally accessible functions  of a contract
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

//reentrancy guard
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";


contract NftByBarter is ReentrancyGuard {

    address payable public immutable feeAccount; //account that receives payment
    uint public immutable feePercent; //fee percent on sales
    uint public itemCount;

    //track nfts listed
    struct SwapItem{
        uint itemId;
        //instance of nft contrat
        IERC721 nft;
        uint tokenId;
        uint price;
        address payable swapper;
        bool swapped;

    }

    event OfferedSwap(
         uint itemId,
         address indexed nft,
         uint tokenId,
         uint price,
         address indexed swapper
        

    );

    event SwappedOne(
         uint itemId,
         address indexed nft,
         uint tokenId,
         uint price,
         address indexed swapper
        
    );

     event SwappedTwo( 
         uint itemId,
         address indexed nft,
         uint tokenId,
         uint price,
         address indexed swapper
        
        

    );

    //store all the itrms
    mapping(uint => SwapItem) public swapitems;

    constructor(uint _feePercent){
        feeAccount = payable(msg.sender);
        feePercent = _feePercent;
    }

    //function to make item
    //from frontend solidity will take address of the nft and turn it into an nft contract instance
    //nonentrant prevents hackers from calling make item function and calling back into it before the first has finished
    function listSwapItem(IERC721 _nft, uint _tokenId, uint _price) external nonReentrant{
        require(_price > 0, "Price must be greater than zero" );

        //increment itemcount
        itemCount++;

        //transfer nft
        _nft.transferFrom(msg.sender, address(this), _tokenId);

        //add new item to items mapping
        swapitems[itemCount] = SwapItem(itemCount, _nft, _tokenId, _price, payable(msg.sender), false);

        //emit event
        emit OfferedSwap(itemCount, address(_nft), _tokenId, _price, msg.sender);
    }

      function swapItem(uint _itemId1, uint _itemId2) external payable nonReentrant {
       uint _totalPrice = getTotalPrice(_itemId1);
       
       SwapItem storage firstItem = swapitems[_itemId1];
       SwapItem storage secondItem = swapitems[_itemId2];

        
      

        require(_itemId1 > 0 && _itemId1 <= itemCount, "item1 doesn't exist");
        require(_itemId2 > 0 && _itemId2 <= itemCount, "item2 doesn't exist");

        //require(msg.value + items[_itemId2].price  >= _totalPrice, "not enough ether to cover item price and market fee");
        require(swapitems[_itemId1].price == swapitems[_itemId2].price, "provide nft of thesame value");

        require(!firstItem.swapped, "item1 already swapped");
        require(!secondItem.swapped, "item2 already swapped");

        

       //transfer nft to buyer
       firstItem.nft.transferFrom(address(this), msg.sender, firstItem.tokenId);
       

       //transfer nft to buyer
       secondItem.nft.transferFrom(address(this), firstItem.swapper, secondItem.tokenId); 
       
       
       //pay seller and feeAccount
       //item.seller.transfer(item.price);
       feeAccount.transfer(_totalPrice - firstItem.price);

       //update item to swapped
       firstItem.swapped = true;
       secondItem.swapped = true;


       //bought event
       emit SwappedOne(_itemId1, address(firstItem.nft), firstItem.tokenId, firstItem.price, firstItem.swapper);
       
       emit SwappedTwo( _itemId2, address(secondItem.nft), secondItem.tokenId, secondItem.price, secondItem.swapper);



    }


    function getTotalPrice(uint _itemId) view public returns(uint) {
          return((swapitems[_itemId].price*(100 + feePercent))/100);
    }

    //compare nfts


 

}
 