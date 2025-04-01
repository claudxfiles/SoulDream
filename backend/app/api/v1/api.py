from fastapi import APIRouter
from app.api.v1.subscriptions import routes as subscription_routes
from app.api.v1.auth import routes as auth_routes
# ... otros imports

api_router = APIRouter()

api_router.include_router(
    subscription_routes.router,
    prefix="/subscriptions",
    tags=["subscriptions"]
)

# ... otros routers 