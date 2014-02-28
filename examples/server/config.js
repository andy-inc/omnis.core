/**
 * Created by Andy <andy@sumskoy.com> on 27/02/14.
 */
global.$app.declare('config', __filename, function(){
    return {
        $omnis: {
            debug: true,
            ip: "127.0.0.1",
            port: 3001,
            static: ["./static"],
            views: {
                path: "./views",
                cache: false,
                engine: "ejs"
            },
            cookie: "very secret worlds",
            session: {
                "options": {
                    "secret": "very secret worlds"
                },
                "store": {
                    "type": "memory",
                    "options": {}
                }
            }
        },
        db: {
            url: "mongodb://localhost/test"
        }
    }
});