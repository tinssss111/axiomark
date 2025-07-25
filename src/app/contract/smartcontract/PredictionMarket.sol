// SPDX-License-Identifier: MIT
// pragma solidity ^0.8.20;

// import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
// import "@openzeppelin/contracts/access/Ownable.sol";
// import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
// import "@openzeppelin/contracts/utils/math/Math.sol";
// import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

// contract SimpleCryptoPredictionMarket is Ownable, ReentrancyGuard {
//     using Math for uint256;

//     // Structs
//     struct Market {
//         uint256 id;
//         string question;
//         uint256 endTime;
//         string image;
//         AggregatorV3Interface priceFeed;
//         bool resolved;
//         bool outcome;
//         uint256 totalYesBets;
//         uint256 totalNoBets;
//         uint256 totalPool;
//         mapping(address => uint256) yesBets;
//         mapping(address => uint256) noBets;
//         mapping(address => bool) hasClaimed;
//         uint256 finalPrice;
//         bool canceled;
//     }

//     // Struct for market details to reduce stack usage
//     struct MarketDetails {
//         string question;
//         uint256 endTime;
//         string image;
//         bool resolved;
//         bool outcome;
//         uint256 totalYesBets;
//         uint256 totalNoBets;
//         uint256 totalPool;
//         uint256 finalPrice;
//         bool canceled;
//     }

//     // State variables
//     IERC20 public immutable usdc;
//     uint256 public marketCount;
//     uint256 public totalFees;
//     uint256 public constant FEE_RATE = 300; // 3% fee (300 basis points)

//     mapping(uint256 => Market) public markets;

//     // Events
//     event MarketCreated(uint256 indexed marketId, string question, uint256 endTime, string image);
//     event BetPlaced(uint256 indexed marketId, address indexed bettor, bool isYes, uint256 amount);
//     event MarketResolved(uint256 indexed marketId, bool outcome, uint256 finalPrice);
//     event WinningsClaimed(uint256 indexed marketId, address indexed user, uint256 amount);
//     event PriceCaptured(uint256 indexed marketId, uint256 finalPrice);
//     event MarketCanceled(uint256 indexed marketId);
//     event RefundClaimed(uint256 indexed marketId, address indexed user, uint256 amount);
//     event FeesWithdrawn(address indexed owner, uint256 amount);

//     constructor(address _usdcAddress, address initialOwner) Ownable(initialOwner) {
//         usdc = IERC20(_usdcAddress);
//     }

//     // Create new market
//     function createMarket(string memory _question, uint256 _endTime, string memory _image, address _priceFeedAddress)
//         external
//         onlyOwner
//         returns (uint256)
//     {
//         require(_endTime > block.timestamp, "End time must be in the future");
//         require(_priceFeedAddress != address(0), "Invalid price feed address");
//         require(bytes(_image).length > 0, "Image cannot be empty");

//         marketCount++;
//         Market storage market = markets[marketCount];
//         market.id = marketCount;
//         market.question = _question;
//         market.endTime = _endTime;
//         market.image = _image;
//         market.priceFeed = AggregatorV3Interface(_priceFeedAddress);

//         emit MarketCreated(marketCount, _question, _endTime, _image);
//         return marketCount;
//     }

//     // Cancel a market (only owner)
//     function cancelMarket(uint256 _marketId) external onlyOwner {
//         require(_marketId <= marketCount && _marketId > 0, "Invalid market ID");
//         Market storage market = markets[_marketId];
//         require(block.timestamp < market.endTime, "Market already ended");
//         require(!market.resolved, "Market already resolved");
//         require(!market.canceled, "Market already canceled");

//         market.canceled = true;
//         emit MarketCanceled(_marketId);
//     }

//     // Refund bets for a canceled market
//     function claimRefund(uint256 _marketId) external nonReentrant {
//         require(_marketId <= marketCount && _marketId > 0, "Invalid market ID");
//         Market storage market = markets[_marketId];
//         require(market.canceled, "Market not canceled");
//         require(!market.hasClaimed[msg.sender], "Already claimed");

//         uint256 userBet = market.yesBets[msg.sender] + market.noBets[msg.sender];
//         require(userBet > 0, "No bets to refund");
//         require(usdc.balanceOf(address(this)) >= userBet, "Insufficient contract balance");

//         market.hasClaimed[msg.sender] = true;

//         require(usdc.transfer(msg.sender, userBet), "USDC transfer failed");
//         emit RefundClaimed(_marketId, msg.sender, userBet);
//     }

//     // Capture final price
//     function captureFinalPrice(uint256 _marketId) external {
//         require(_marketId <= marketCount && _marketId > 0, "Invalid market ID");
//         Market storage market = markets[_marketId];
//         require(block.timestamp >= market.endTime, "Market not ended");
//         require(!market.resolved, "Market already resolved");
//         require(!market.canceled, "Market canceled");
//         require(market.finalPrice == 0, "Price already captured");

//         (, int256 price,,,) = market.priceFeed.latestRoundData();
//         require(price > 0, "Invalid price from Chainlink");

//         market.finalPrice = uint256(price);

//         emit PriceCaptured(_marketId, market.finalPrice);
//     }

//     // Resolve market
//     function resolveMarket(uint256 _marketId, bool _outcome) external onlyOwner {
//         require(_marketId <= marketCount && _marketId > 0, "Invalid market ID");
//         Market storage market = markets[_marketId];
//         require(block.timestamp >= market.endTime, "Market not ended");
//         require(!market.resolved, "Market already resolved");
//         require(market.finalPrice > 0, "Price not captured yet");
//         require(!market.canceled, "Market canceled");

//         market.outcome = _outcome;
//         market.resolved = true;

//         uint256 fee = (market.totalPool * FEE_RATE) / 10000;
//         totalFees += fee;

//         emit MarketResolved(_marketId, market.outcome, market.finalPrice);
//     }

//     // Get stored final price
//     function getFinalPrice(uint256 _marketId) public view returns (uint256) {
//         require(_marketId <= marketCount && _marketId > 0, "Invalid market ID");
//         Market storage market = markets[_marketId];
//         require(market.finalPrice > 0, "Price not captured yet");
//         return market.finalPrice;
//     }

//     // Calculate current winning ratio for YES or NO
//     function getWinningRatio(uint256 _marketId, bool _isYes) public view returns (uint256) {
//         require(_marketId <= marketCount && _marketId > 0, "Invalid market ID");
//         Market storage market = markets[_marketId];

//         if (market.canceled) return 0;
//         if (market.totalPool == 0) return 1e18;

//         uint256 winningPool = _isYes ? market.totalYesBets : market.totalNoBets;
//         if (winningPool == 0) return 0;

//         uint256 totalAfterFee = market.totalPool - ((market.totalPool * FEE_RATE) / 10000);
//         return (totalAfterFee * 1e18) / winningPool;
//     }

//     // Calculate potential winnings for a bet
//     function calculatePotentialWinnings(uint256 _marketId, bool _isYes, uint256 _betAmount)
//         public
//         view
//         returns (uint256)
//     {
//         require(_marketId <= marketCount && _marketId > 0, "Invalid market ID");
//         Market storage market = markets[_marketId];

//         if (market.canceled) return 0;

//         uint256 newTotalPool = market.totalPool + _betAmount;
//         uint256 newWinningPool = _isYes ? market.totalYesBets + _betAmount : market.totalNoBets + _betAmount;

//         if (newWinningPool == 0) return 0;

//         uint256 totalAfterFee = newTotalPool - ((newTotalPool * FEE_RATE) / 10000);
//         return (_betAmount * totalAfterFee) / newWinningPool;
//     }

//     // Place YES/NO bet
//     function placeBet(uint256 _marketId, bool _isYes, uint256 _amount) external nonReentrant {
//         require(_marketId <= marketCount && _marketId > 0, "Invalid market ID");
//         Market storage market = markets[_marketId];
//         require(block.timestamp < market.endTime, "Market ended");
//         require(!market.resolved, "Market resolved");
//         require(!market.canceled, "Market canceled");
//         require(_amount > 0, "Amount must be positive");
//         require(usdc.transferFrom(msg.sender, address(this), _amount), "USDC transfer failed");

//         if (_isYes) {
//             market.yesBets[msg.sender] += _amount;
//             market.totalYesBets += _amount;
//         } else {
//             market.noBets[msg.sender] += _amount;
//             market.totalNoBets += _amount;
//         }

//         market.totalPool += _amount;

//         emit BetPlaced(_marketId, msg.sender, _isYes, _amount);
//     }

//     // Claim winnings
//     function claimWinnings(uint256 _marketId) external nonReentrant {
//         require(_marketId <= marketCount && _marketId > 0, "Invalid market ID");
//         Market storage market = markets[_marketId];
//         require(market.resolved, "Market not resolved");
//         require(!market.canceled, "Market canceled");
//         require(!market.hasClaimed[msg.sender], "Already claimed");

//         uint256 userBet = market.outcome ? market.yesBets[msg.sender] : market.noBets[msg.sender];
//         require(userBet > 0, "No winning bet");

//         uint256 winningPool = market.outcome ? market.totalYesBets : market.totalNoBets;
//         require(winningPool > 0, "No winning pool");

//         uint256 totalAfterFee = market.totalPool - ((market.totalPool * FEE_RATE) / 10000);
//         uint256 winnings = (userBet * totalAfterFee) / winningPool;
//         require(usdc.balanceOf(address(this)) >= winnings, "Insufficient contract balance");

//         market.hasClaimed[msg.sender] = true;

//         require(usdc.transfer(msg.sender, winnings), "USDC transfer failed");
//         emit WinningsClaimed(_marketId, msg.sender, winnings);
//     }

//     // Get market details (using struct to reduce stack usage)
//     function getMarketDetails(uint256 _marketId) external view returns (MarketDetails memory) {
//         require(_marketId <= marketCount && _marketId > 0, "Invalid market ID");
//         Market storage market = markets[_marketId];
//         return MarketDetails(
//             market.question,
//             market.endTime,
//             market.image,
//             market.resolved,
//             market.outcome,
//             market.totalYesBets,
//             market.totalNoBets,
//             market.totalPool,
//             market.finalPrice,
//             market.canceled
//         );
//     }

//     // Get winning ratios for both YES and NO
//     function getWinningRatios(uint256 _marketId) external view returns (uint256 yesRatio, uint256 noRatio) {
//         return (getWinningRatio(_marketId, true), getWinningRatio(_marketId, false));
//     }

//     // Get user bets
//     function getUserBets(uint256 _marketId, address _user) external view returns (uint256 yesBet, uint256 noBet) {
//         require(_marketId <= marketCount && _marketId > 0, "Invalid market ID");
//         Market storage market = markets[_marketId];
//         return (market.yesBets[_user], market.noBets[_user]);
//     }

//     // Get potential winnings for user
//     function getUserPotentialWinnings(uint256 _marketId, address _user) external view returns (uint256) {
//         require(_marketId <= marketCount && _marketId > 0, "Invalid market ID");
//         Market storage market = markets[_marketId];

//         if (!market.resolved || market.canceled) return 0;

//         uint256 userBet = market.outcome ? market.yesBets[_user] : market.noBets[_user];
//         if (userBet == 0) return 0;

//         uint256 winningPool = market.outcome ? market.totalYesBets : market.totalNoBets;
//         if (winningPool == 0) return 0;

//         uint256 totalAfterFee = market.totalPool - ((market.totalPool * FEE_RATE) / 10000);
//         return (userBet * totalAfterFee) / winningPool;
//     }

//     // Check if user has claimed
//     function hasUserClaimed(uint256 _marketId, address _user) external view returns (bool) {
//         require(_marketId <= marketCount && _marketId > 0, "Invalid market ID");
//         return markets[_marketId].hasClaimed[_user];
//     }

//     // Withdraw fees (only owner)
//     function withdrawFees() external onlyOwner {
//         require(totalFees > 0, "No fees to withdraw");
//         require(usdc.balanceOf(address(this)) >= totalFees, "Insufficient contract balance");

//         uint256 feesToWithdraw = totalFees;
//         totalFees = 0;

//         require(usdc.transfer(owner(), feesToWithdraw), "Transfer failed");
//         emit FeesWithdrawn(owner(), feesToWithdraw);
//     }
// }
