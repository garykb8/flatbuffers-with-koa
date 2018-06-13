const Koa = require('koa');
const Router = require('koa-router');
const flatbuffers = require('flatbuffers').flatbuffers;
var MyGreeting = require('./greeting_generated').MyGreeting;

const app = new Koa();
const router = new Router();

/**
 * Get buffer data
 * @param {*} ctx Koa ctx
 */
function getRawBody(ctx) {
    return new Promise((resolve, reject) => {
        if (!ctx.is('application/octet-stream')) {
            resolve(ctx.request.body);
        } else {
            var data = [];
            ctx.req.on('data', chunk => data.push(chunk));
            ctx.req.on('end', () => {
                data = Buffer.concat(data);
                resolve(data);
            });
        }
    });
}

/**
 * Middleware for get raw body
 */
router.use(async (ctx, next) => {
    ctx.request.body = await getRawBody(ctx);
    await next();
});

/**
 * Return greeting message
 * @param {string} name Name
 * @returns {*} FlatBuffers data
 */
function returnGreeting(name) {
    // Serialize flatbuffers data
    var builder = new flatbuffers.Builder(0);
    var message = builder.createString(`Hello ${name}`);
    MyGreeting.Sample.Greeting.startGreeting(builder);
    MyGreeting.Sample.Greeting.addName(builder, message);
    var greetingMessage = MyGreeting.Sample.Greeting.endGreeting(builder);
    builder.finish(greetingMessage);

    const buf = builder.asUint8Array();
    return buf;
}


/**
 * Receive greeting name API
 */
router.post('/', (ctx, next) => {

    // Deserialize flatbuffers data
    const buf = new flatbuffers.ByteBuffer(ctx.request.body);
    const monster = MyGreeting.Sample.Greeting.getRootAsGreeting(buf);
    const retBuf = returnGreeting(monster.name());
    ctx.body = Buffer(retBuf);
});

const port = 5566;
app.use(router.routes())
    .use(router.allowedMethods())
    .listen(port, () => {
        console.log(`server is running on port ${port}`);
    });

