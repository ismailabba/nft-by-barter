//SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

 //inherit all op zeppl functions
contract NFT is ERC721URIStorage {
   //statevariable
   uint public tokenCount;

   constructor() ERC721("Afro NFT", "AFRO"){}

   //minting of new nfts
   //external function called outside but not by any function inside d contract
   function mint(string memory _tokenURI) external returns(uint){
    tokenCount ++;
    _safeMint(msg.sender, tokenCount);
    //function that sets meta data 4 newly minted nft
    _setTokenURI(tokenCount, _tokenURI);
    return(tokenCount);

   }

}