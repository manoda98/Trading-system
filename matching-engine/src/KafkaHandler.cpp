#include "KafkaHandler.h"
#include <iostream>

KafkaHandler::KafkaHandler(const std::string& brokers_, const std::string& topic_)
    : brokers(brokers_), topic(topic_), consumer(nullptr) {

    std::string errstr;

    RdKafka::Conf* conf = RdKafka::Conf::create(RdKafka::Conf::CONF_GLOBAL);
    conf->set("bootstrap.servers", brokers, errstr);
    conf->set("group.id", "matching-engine-group", errstr);

    consumer = RdKafka::KafkaConsumer::create(conf, errstr);
    if (!consumer) {
        std::cerr << "Failed to create consumer: " << errstr << std::endl;
        exit(1);
    }
    delete conf;

    consumer->subscribe({topic});
    std::cout << "Kafka consumer initialized for topic: " << topic << std::endl;
}

KafkaHandler::~KafkaHandler() {
    consumer->close();
    delete consumer;
    RdKafka::wait_destroyed(5000);
}

void KafkaHandler::consumeMessages(std::function<void(const json&)> callback) {
    while (true) {
        RdKafka::Message* msg = consumer->consume(1000);
        if (!msg) continue;

        switch (msg->err()) {
            case RdKafka::ERR_NO_ERROR: {
                std::string payload(static_cast<const char*>(msg->payload()), msg->len());
                try {
                    json j = json::parse(payload);
                    callback(j);
                } catch (const std::exception& e) {
                    std::cerr << "JSON parse error: " << e.what() << std::endl;
                }
                break;
            }
            case RdKafka::ERR__TIMED_OUT:
                break;
            default:
                std::cerr << "Consumer error: " << msg->errstr() << std::endl;
                break;
        }

        delete msg;
    }
}
