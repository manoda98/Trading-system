#include "OrderBook.h"
#include <algorithm>

OrderBook::OrderBook(const std::string& sym) : symbol(sym) {}

std::string OrderBook::generateTradeId() {
    static long long counter = 0;
    return "T" + std::to_string(++counter);
}

std::vector<Trade> OrderBook::addOrder(const Order& incoming) {
    std::vector<Trade> trades;

    Order working = incoming;

    if (working.remainingSize <= 0) 
        working.remainingSize = working.size;

    if (working.side == OrderSide::BUY) {
        // match against best asks
        while (!working.isFilled() && !sellOrders.empty()) {
            auto bestAskIt = sellOrders.begin();
            double bestAskPrice = bestAskIt->first;

            // buy can only match if buyPrice >= bestAsk
            if (working.price < bestAskPrice) break;

            auto& dq = bestAskIt->second;
            if (dq.empty()) { sellOrders.erase(bestAskIt); continue; }

            Order& makerSell = dq.front();

            double qty = std::min(working.remainingSize, makerSell.remainingSize);
            double px = makerSell.price; // maker price

            Trade t;
            t.tradeId = generateTradeId();
            t.symbol = working.symbol;
            t.price = px;
            t.quantity = qty;
            t.timestamp = std::chrono::system_clock::now();

            t.buyOrderId = working.orderId;
            t.buyUserId  = working.userId;

            t.sellOrderId = makerSell.orderId;
            t.sellUserId  = makerSell.userId;

            trades.push_back(t);

            working.remainingSize -= qty;
            makerSell.remainingSize -= qty;

            // maker filled -> remove
            if (makerSell.isFilled()) {
                dq.pop_front();
                if (dq.empty()) sellOrders.erase(bestAskIt);
            }
        }

        if (!working.isFilled()) {
            buyOrders[working.price].push_back(working);
        }

    } else {
        // SELL: match against best bids
        while (!working.isFilled() && !buyOrders.empty()) {
            auto bestBidIt = buyOrders.begin();
            double bestBidPrice = bestBidIt->first;

            // sell can only match if sellPrice <= bestBid
            if (working.price > bestBidPrice) break;

            auto& dq = bestBidIt->second;
            if (dq.empty()) { buyOrders.erase(bestBidIt); continue; }

            Order& makerBuy = dq.front();

            double qty = std::min(working.remainingSize, makerBuy.remainingSize);
            double px = makerBuy.price; // maker price

            Trade t;
            t.tradeId = generateTradeId();
            t.symbol = working.symbol;
            t.price = px;
            t.quantity = qty;
            t.timestamp = std::chrono::system_clock::now();

            t.buyOrderId = makerBuy.orderId;
            t.buyUserId  = makerBuy.userId;

            t.sellOrderId = working.orderId;
            t.sellUserId  = working.userId;

            trades.push_back(t);

            working.remainingSize -= qty;
            makerBuy.remainingSize -= qty;

            if (makerBuy.isFilled()) {
                dq.pop_front();
                if (dq.empty()) buyOrders.erase(bestBidIt);
            }
        }

        if (!working.isFilled()) {
            sellOrders[working.price].push_back(working);
        }
    }

    return trades;
}

bool OrderBook::cancelOrder(const std::string& orderId, Order& cancelledOut) {
    // BUY side
    for (auto it = buyOrders.begin(); it != buyOrders.end(); ) {
        auto& dq = it->second;
        for (auto odIt = dq.begin(); odIt != dq.end(); ++odIt) {
            if (odIt->orderId == orderId && !odIt->isFilled()) {
                cancelledOut = *odIt;
                dq.erase(odIt);
                if (dq.empty()) buyOrders.erase(it);
                return true;
            }
        }
        ++it;
    }

    // SELL side
    for (auto it = sellOrders.begin(); it != sellOrders.end(); ) {
        auto& dq = it->second;
        for (auto odIt = dq.begin(); odIt != dq.end(); ++odIt) {
            if (odIt->orderId == orderId && !odIt->isFilled()) {
                cancelledOut = *odIt;
                dq.erase(odIt);
                if (dq.empty()) sellOrders.erase(it);
                return true;
            }
        }
        ++it;
    }

    return false;
}

bool OrderBook::modifyOrder(const std::string& orderId, double newSize, double newPrice, Order& modifiedOut) {
    if (newSize <= 0 || newPrice <= 0) return false;

    Order found;
    bool foundAny = false;

    // try cancel from BUY
    for (auto it = buyOrders.begin(); it != buyOrders.end(); ) {
        auto& dq = it->second;
        for (auto odIt = dq.begin(); odIt != dq.end(); ++odIt) {
            if (odIt->orderId == orderId && !odIt->isFilled()) {
                found = *odIt;
                dq.erase(odIt);
                if (dq.empty()) buyOrders.erase(it);
                foundAny = true;
                goto APPLY;
            }
        }
        ++it;
    }

    // try cancel from SELL
    for (auto it = sellOrders.begin(); it != sellOrders.end(); ) {
        auto& dq = it->second;
        for (auto odIt = dq.begin(); odIt != dq.end(); ++odIt) {
            if (odIt->orderId == orderId && !odIt->isFilled()) {
                found = *odIt;
                dq.erase(odIt);
                if (dq.empty()) sellOrders.erase(it);
                foundAny = true;
                goto APPLY;
            }
        }
        ++it;
    }

APPLY:
    if (!foundAny) return false;

    // beginner rule: modifying resets remaining size to newSize
    found.size = newSize;
    found.price = newPrice;
    found.remainingSize = newSize;
    found.status = OrderStatus::PENDING;

    modifiedOut = found;

    // Put back (and match)
    addOrder(found);
    return true;
}

std::vector<Order> OrderBook::getOpenOrdersFiltered(
    const std::string& requesterUserId,
    bool ownOnly,
    const std::string& sideFilter,
    const std::string& symbolFilter
) const {
    std::vector<Order> out;

    auto wantSide = [&](OrderSide s) {
        if (sideFilter.empty()) return true;
        if (sideFilter == "BUY") return s == OrderSide::BUY;
        if (sideFilter == "SELL") return s == OrderSide::SELL;
        return true;
    };

    auto wantSymbol = [&](const Order& o) {
        if (symbolFilter.empty()) return true;
        return o.symbol == symbolFilter;
    };

    auto wantUser = [&](const Order& o) {
        if (ownOnly) return o.userId == requesterUserId;
        return o.userId != requesterUserId; 
    };

    // BUY
    for (const auto& [px, dq] : buyOrders) {
        for (const auto& o : dq) {
            if (!o.isFilled() && wantSide(o.side) && wantSymbol(o) && wantUser(o)) {
                out.push_back(o);
            }
        }
    }

    // SELL
    for (const auto& [px, dq] : sellOrders) {
        for (const auto& o : dq) {
            if (!o.isFilled() && wantSide(o.side) && wantSymbol(o) && wantUser(o)) {
                out.push_back(o);
            }
        }
    }

    return out;
}
