#include "OrderBook.h"
#include <algorithm>

OrderBook::OrderBook(std::string sym) : symbol(std::move(sym)) {}

std::string OrderBook::nextTradeId() {
    tradeCounter++;
    return "T" + std::to_string(tradeCounter);
}

void OrderBook::eraseEmptyLevel(bool isBuy, double price) {
    if (isBuy) {
        auto it = buy.find(price);
        if (it != buy.end() && it->second.empty()) buy.erase(it);
    } else {
        auto it = sell.find(price);
        if (it != sell.end() && it->second.empty()) sell.erase(it);
    }
}

bool OrderBook::hasOrder(const std::string& orderId) const {
    return index.find(orderId) != index.end();
}

bool OrderBook::getOrderSidePrice(const std::string& orderId, bool& isBuy, double& price) const {
    auto it = index.find(orderId);
    if (it == index.end()) return false;
    isBuy = it->second.isBuy;
    price = it->second.price;
    return true;
}

std::vector<Trade> OrderBook::addOrder(const Order& in) {
    std::vector<Trade> trades;

    Order working = in;
    working.remainingSize = in.remainingSize > 0 ? in.remainingSize : in.size;

    if (working.side == OrderSide::BUY) {
        // match against best sell
        while (!working.isFilled() && !sell.empty()) {
            auto bestAskIt = sell.begin();
            double bestAskPrice = bestAskIt->first;

            if (working.price < bestAskPrice) break;

            auto& dq = bestAskIt->second;
            if (dq.empty()) {
                sell.erase(bestAskIt);
                continue;
            }

            Order& makerSell = dq.front();
            double qty = std::min(working.remainingSize, makerSell.remainingSize);
            double px  = makerSell.price; // maker price

            Trade t;
            t.tradeId = nextTradeId();
            t.buyOrderId = working.orderId;
            t.sellOrderId = makerSell.orderId;
            t.buyUserId = working.userId;
            t.sellUserId = makerSell.userId;
            t.symbol = working.symbol;
            t.price = px;
            t.quantity = qty;
            t.timestamp = std::chrono::system_clock::now();
            trades.push_back(t);

            working.remainingSize -= qty;
            makerSell.remainingSize -= qty;

            if (makerSell.isFilled()) {
                index.erase(makerSell.orderId);
                dq.pop_front();
                if (dq.empty()) sell.erase(bestAskIt);
            }
        }

        if (!working.isFilled()) {
            working.status = OrderStatus::PENDING;
            buy[working.price].push_back(working);
            index[working.orderId] = {true, working.price};
        }

    } else {
        // match against best buy
        while (!working.isFilled() && !buy.empty()) {
            auto bestBidIt = buy.begin();
            double bestBidPrice = bestBidIt->first;

            if (working.price > bestBidPrice) break;

            auto& dq = bestBidIt->second;
            if (dq.empty()) {
                buy.erase(bestBidIt);
                continue;
            }

            Order& makerBuy = dq.front();
            double qty = std::min(working.remainingSize, makerBuy.remainingSize);
            double px  = makerBuy.price;

            Trade t;
            t.tradeId = nextTradeId();
            t.buyOrderId = makerBuy.orderId;
            t.sellOrderId = working.orderId;
            t.buyUserId = makerBuy.userId;
            t.sellUserId = working.userId;
            t.symbol = working.symbol;
            t.price = px;
            t.quantity = qty;
            t.timestamp = std::chrono::system_clock::now();
            trades.push_back(t);

            working.remainingSize -= qty;
            makerBuy.remainingSize -= qty;

            if (makerBuy.isFilled()) {
                index.erase(makerBuy.orderId);
                dq.pop_front();
                if (dq.empty()) buy.erase(bestBidIt);
            }
        }

        if (!working.isFilled()) {
            working.status = OrderStatus::PENDING;
            sell[working.price].push_back(working);
            index[working.orderId] = {false, working.price};
        }
    }

    return trades;
}

bool OrderBook::cancelOrder(const std::string& orderId) {
    auto it = index.find(orderId);
    if (it == index.end()) return false;

    bool isBuy = it->second.isBuy;
    double px  = it->second.price;

    if (isBuy) {
        auto lvl = buy.find(px);
        if (lvl == buy.end()) { index.erase(it); return false; }

        auto& dq = lvl->second;
        for (auto d = dq.begin(); d != dq.end(); ++d) {
            if (d->orderId == orderId) {
                dq.erase(d);
                index.erase(it);
                eraseEmptyLevel(true, px);
                return true;
            }
        }
    } else {
        auto lvl = sell.find(px);
        if (lvl == sell.end()) { index.erase(it); return false; }

        auto& dq = lvl->second;
        for (auto d = dq.begin(); d != dq.end(); ++d) {
            if (d->orderId == orderId) {
                dq.erase(d);
                index.erase(it);
                eraseEmptyLevel(false, px);
                return true;
            }
        }
    }

    index.erase(it);
    return false;
}

void OrderBook::loadFromLevels(
    const std::map<double, std::deque<Order>, std::greater<double>>& b,
    const std::map<double, std::deque<Order>, std::less<double>>& s
) {
    buy = b;
    sell = s;
    index.clear();

    for (auto& [px, dq] : buy) {
        for (auto& o : dq) index[o.orderId] = {true, px};
    }
    for (auto& [px, dq] : sell) {
        for (auto& o : dq) index[o.orderId] = {false, px};
    }
}
