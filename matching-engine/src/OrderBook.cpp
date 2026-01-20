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
        
    }

}