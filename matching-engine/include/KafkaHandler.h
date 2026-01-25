#ifndef KAFKA_HANDLER_H
#define KAFKA_HANDLER_H

#include <string>
#include <functional>
#include <librdkafka/rdkafkacpp.h>
#include <nlohmann/json.hpp>

using json = nlohmann::json;

class KafkaHandler {
private:
    std::string brokers;
    std::string topic;
    RdKafka::KafkaConsumer* consumer;

public:
    KafkaHandler(const std::string& brokers, const std::string& topic);
    ~KafkaHandler();
    void consumeMessages(std::function<void(const json&)> callback);
};

#endif
