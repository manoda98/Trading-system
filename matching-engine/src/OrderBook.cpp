#include "OrderBook.h"
#include <random>
#include <algorithm>

std::vector<Trade> OrderBook::addOrder(const Order& order) {
    std::vector<Trade> trades;
    Order workingOrder = order;
    workingOrder.remainingSize = order.size;

    if (order.side == OrderSide::BUY) {
        //try to match with sell orders
        while (!workingOrder.isFilled() && !sellOrders.empty()) {
            auto bestAskIt = sellOrders.begin();
            double bestAskPrice = bestAskIt->first;

            if (workingOrder.price < bestAskPrice) {
                break;
            }

            auto& sellQueue = bestAskIt->second;
            if (sellQueue.empty()) {
                sellOrders.erase(bestAskIt);
                continue;
            }

            Order& sellOrder = sellQueue.front();

            double tradeQuantity = std::min(workingOrder.remainingSize, sellOrder.remainingSize);
            double tradePrice = sellOrder.price;
            
            Trade trade;
            trade.tradeId = generateTradeId();
            trade.buyOrderId = workingOrder.orderId;
            trade.sellOrderId = sellOrder.orderId;
            trade.symbol = workingOrder.symbol;
            trade.price = tradePrice;
            trade.quantity = tradeQuantity;
            trade.timestamp = std::chrono::system_clock::now();
            trades.push_back(trade);

            workingOrder.remainingSize -= tradeQuantity;
            sellOrder.remainingSize -= tradeQuantity;

            if (sellOrder.isFilled()) {
                orderPriceMap.erase(sellOrder.orderId);
                sellQueue.pop();
                if (sellQueue.empty()) {
                    sellOrders.erase(bestAskIt);
                }
            }
        }
        if (!workingOrder.isFilled()) {
            buyOrders[workingOrder.price].push(workingOrder);
            orderPriceMap[workingOrder.orderId] = workingOrder.price;
        }
    } else {
        while (!workingOrder.isFilled() && !buyOrders.empty()) {
            auto bestBidIt = buyOrders.begin();
            double bestBidPrice = bestBidIt->first;

            if (workingOrder.price > bestBidPrice) {
                break;
            }

            auto& buyQueue = bestBidIt->second;
            if (buyQueue.empty()) {
                buyOrders.erase(bestBidIt);
                continue;
            }

            Order& buyOrder = buyQueue.front();

            double tradeQuantity = std::min(workingOrder.remainingSize, buyOrder.remainingSize);
            double tradePrice = buyOrder.price;

            Trade trade;
            trade.tradeId = generateTradeId();
            trade.buyOrderId = buyOrder.orderId;
            trade.sellOrderId = workingOrder.orderId;
            trade.symbol = workingOrder.symbol;
            trade.price = tradePrice;
            trade.quantity = tradeQuantity;
            trade.timestamp = std::chrono::system_clock::now();
            trades.push_back(trade);

            workingOrder.remainingSize -= tradeQuantity;
            buyOrder.remainingSize -= tradeQuantity;

            if (buyOrder.isFilled()) {
                orderPriceMap.erase(buyOrder.orderId);
                buyQueue.pop();
                if (buyQueue.empty()) {
                    buyOrders.erase(bestBidIt);
                }
            }
        }
        if ( !workingOrder.isFilled()) {
            sellOrders[workingOrder.price].push(workingOrder);
            orderPriceMap[workingOrder.orderId] = workingOrder.price;
        }
    }

    return trades;

}