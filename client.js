const flatbuffers = require('flatbuffers').flatbuffers;
const request = require('request');
var MyGreeting = require('./greeting_generated').MyGreeting;


/**
 * Send greeting request
 * @param {*} buf FlatBuffers data
 */
function sendRequest(buf) {
    const options = {
        url: 'http://localhost:5566',
        headers: {
            'content-type': 'application/octet-stream'
        },
        encoding: null,
        body: Buffer(buf)
    };
    request.post(options, (err, res, body) => {
        if (err) console.error(err);

        // Deserialize flatbuffers data
        const buf = new flatbuffers.ByteBuffer(body);
        const message = MyGreeting.Sample.Greeting.getRootAsGreeting(buf);
        console.log(message.name());
    })
}


function main() {
    // Serialize flatbuffers data
    var builder = new flatbuffers.Builder(0);
    var name = builder.createString('Pikachu');
    MyGreeting.Sample.Greeting.startGreeting(builder);
    MyGreeting.Sample.Greeting.addName(builder, name);
    var greetingName = MyGreeting.Sample.Greeting.endGreeting(builder);
    builder.finish(greetingName);

    const buf = builder.asUint8Array();
    sendRequest(buf);
}

main();
