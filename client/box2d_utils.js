
b2AABB  = Box2D.Collision.b2AABB;
b2World = Box2D.Dynamics.b2World;
b2Vec2 = Box2D.Common.Math.b2Vec2;
b2DebugDraw = Box2D.Dynamics.b2DebugDraw;
b2Body = Box2D.Dynamics.b2Body;
b2BodyDef = Box2D.Dynamics.b2BodyDef;
b2FixtureDef = Box2D.Dynamics.b2FixtureDef;
b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;
b2CircleShape = Box2D.Collision.Shapes.b2CircleShape;
b2MouseJointDef = Box2D.Dynamics.Joints.b2MouseJointDef;
b2ContactListener = Box2D.Dynamics.b2ContactListener;

var world = new b2World(new b2Vec2(0, 10), true);

function createStaticRect(x, y, w, h){
    bodyDef = new b2BodyDef();  
    bodyDef.type = b2Body.b2_staticBody;

    fixDef = new b2FixtureDef();
    fixDef.shape = new b2PolygonShape;
    fixDef.shape.SetAsBox(w/2, h/2);
    bodyDef.position.Set(x, y);
    body = world.CreateBody(bodyDef);
    body.CreateFixture(fixDef);
    return body
}

function createDynamicRect(x, y, w, h){
    bodyDef = new b2BodyDef();  
    bodyDef.type = b2Body.b2_dynamicBody;

    fixDef = new b2FixtureDef();
    fixDef.shape = new b2PolygonShape;
    fixDef.shape.SetAsBox(w/2, h/2);
    bodyDef.position.Set(x, y);
    body = world.CreateBody(bodyDef);
    body.CreateFixture(fixDef);
    return body
}

// objects
function StaticRect(x, y, w, h){
    this.position = {x: x, y: y}
    this.size = {x: w, y: h}
    this.body = createStaticRect(x, y, w, h)

    this.draw = function(ctx){
        ctx.fillStyle = "#fff"
        ctx.fillRect(this.position.x - this.size.x/2, this.position.y-this.size.y/2, this.size.x, this.size.y)
    }
}