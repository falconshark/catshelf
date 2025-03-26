from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, BookViewSet

router = DefaultRouter()
router.register('user', UserViewSet)
router.register('book', BookViewSet)

urlpatterns = [
    path('', include(router.urls))
]