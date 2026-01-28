#include "KafkaHandler.h"
#include <iostream>

void DeliveryReportCb::dr_cb(RdKafka::Message& message) {
    if (message.err() != RdKafka::ERR_NO_ERROR) {
        std::cerr << "[Kafka][DR] Delivery failed: " << message.errstr() << "\n";
    }
    
}

KafkaHandler::KafkaHandler(const std::string& brokers_) : brokers(brokers_) {
    std::string err;

    // consumer creation
    RdKafka::Conf* conf = RdKafka::Conf::create(RdKafka::Conf::CONF_GLOBAL);
    conf->set("bootstrap.servers", brokers, err);
    conf->set("group.id", "matching-engine-group", err);

   
    conf->set("enable.auto.commit", "true", err);
    conf->set("auto.offset.reset", "earliest", err);

    consumer = RdKafka::KafkaConsumer::create(conf, err);
    if (!consumer) {
        std::cerr << "Failed to create consumer: " << err << "\n";
        std::exit(1);
    }
    delete conf;

    // producer creation
    RdKafka::Conf* pconf = RdKafka::Conf::create(RdKafka::Conf::CONF_GLOBAL);
    pconf->set("bootstrap.servers", brokers, err);

  
    pconf->set("dr_cb", &drCb, err);

    producer = RdKafka::Producer::create(pconf, err);
    if (!producer) {
        std::cerr << "Failed to create producer: " << err << "\n";
        std::exit(1);
    }
    delete pconf;

    std::cout << "KafkaHandler ready. Brokers=" << brokers << "\n";
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

            
            if (msg->key()) info.key = *msg->key();

            callback(info);
        } catch (const std::exception& e) {
            std::cerr << "JSON parse error: " << e.what() << "\n";
        }

       
        producer->poll(0);
    }
}

void KafkaHandler::produce(const std::string& topicName, const json& payload) {
   
    produce(topicName, "", payload);
}

void KafkaHandler::produce(const std::string& topicName, const std::string& key, const json& payload) {
    std::string message = payload.dump();

    const void* keyPtr = nullptr;
    size_t keyLen = 0;

    if (!key.empty()) {
        keyPtr = key.data();
        keyLen = key.size();
    }

    RdKafka::ErrorCode ec = producer->produce(
        topicName,
        RdKafka::Topic::PARTITION_UA,
        RdKafka::Producer::RK_MSG_COPY,
        const_cast<char*>(message.c_str()),
        message.size(),
        keyPtr,
        keyLen,
        0,
        nullptr
    );

    if (ec != RdKafka::ERR_NO_ERROR) {
        std::cerr << "Produce failed: " << RdKafka::err2str(ec) << "\n";
    }

   
    producer->poll(0);
}
