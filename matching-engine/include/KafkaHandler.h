#ifndef KAFKA_HANDLER_H
#define KAFKA_HANDLER_H

#include <string>
#include <functional>
#include <memory>
#include <librdkafka/rdkafkacpp.h>
#include <nlohmann/json.hpp>

using json = nlohmann::json;

struct ConsumedMessageInfo {
    json data;
    int64_t offset{-1};
    int32_t partition{0};
    std::string key; 
};


class DeliveryReportCb : public RdKafka::DeliveryReportCb {
public:
    void dr_cb(RdKafka::Message& message) override;
};

class KafkaHandler {
private:
    std::string brokers;
    RdKafka::KafkaConsumer* consumer{nullptr};
    RdKafka::Producer* producer{nullptr};
    DeliveryReportCb drCb; 

public:
    explicit KafkaHandler(const std::string& brokers);
    ~KafkaHandler();

    void consume(const std::string& topic, std::function<void(const ConsumedMessageInfo&)> callback);


    void produce(const std::string& topic, const json& payload);

    void produce(const std::string& topic, const std::string& key, const json& payload);
};

#endif
