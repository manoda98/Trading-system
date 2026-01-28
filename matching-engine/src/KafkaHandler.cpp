#include "KafkaHandler.h"
#include <iostream>

KafkaHandler::KafkaHandler(const std::string& brokers_) : brokers(brokers_) {
    std::string err;

    // Consumer config
    RdKafka::Conf* conf = RdKafka::Conf::create(RdKafka::Conf::CONF_GLOBAL);
    conf->set("bootstrap.servers", brokers, err);
    conf->set("group.id", "matching-engine-group", err);
    conf->set("enable.auto.commit", "true", err); // simple for now
    conf->set("auto.offset.reset", "earliest", err);

    consumer = RdKafka::KafkaConsumer::create(conf, err);
    if (!consumer) {
        std::cerr << "Failed to create consumer: " << err << "\n";
        std::exit(1);
    }
    delete conf;

    // Producer config
    RdKafka::Conf* pconf = RdKafka::Conf::create(RdKafka::Conf::CONF_GLOBAL);
    pconf->set("bootstrap.servers", brokers, err);

    producer = RdKafka::Producer::create(pconf, err);
    if (!producer) {
        std::cerr << "Failed to create producer: " << err << "\n";
        std::exit(1);
    }
    delete pconf;
}

KafkaHandler::~KafkaHandler() {
    if (consumer) {
        consumer->close();
        delete consumer;
        consumer = nullptr;
    }
    if (producer) {
        producer->flush(3000);
        delete producer;
        producer = nullptr;
    }
    RdKafka::wait_destroyed(5000);
}

void KafkaHandler::consume(const std::string& topic, std::function<void(const ConsumedMessageInfo&)> callback) {
    consumer->subscribe({topic});
    std::cout << "Consuming topic: " << topic << "\n";

    while (true) {
        std::unique_ptr<RdKafka::Message> msg(consumer->consume(1000));
        if (!msg) continue;

        if (msg->err() == RdKafka::ERR__TIMED_OUT) continue;
        if (msg->err() != RdKafka::ERR_NO_ERROR) {
            std::cerr << "Consume error: " << msg->errstr() << "\n";
            continue;
        }

        std::string payload(static_cast<const char*>(msg->payload()), msg->len());
        try {
            ConsumedMessageInfo info;
            info.data = json::parse(payload);
            info.offset = msg->offset();
            info.partition = msg->partition();
            callback(info);
        } catch (const std::exception& e) {
            std::cerr << "JSON parse error: " << e.what() << "\n";
        }
    }
}

void KafkaHandler::produce(const std::string& topicName, const json& payload) {
    std::string err;
    std::string message = payload.dump();

    RdKafka::ErrorCode ec = producer->produce(
        topicName,
        RdKafka::Topic::PARTITION_UA,
        RdKafka::Producer::RK_MSG_COPY,
        const_cast<char*>(message.c_str()),
        message.size(),
        nullptr,
        0,
        0,
        nullptr
    );

    if (ec != RdKafka::ERR_NO_ERROR) {
        std::cerr << "Produce failed: " << RdKafka::err2str(ec) << "\n";
    }

    producer->poll(0);
    producer->flush(5000); 
}
