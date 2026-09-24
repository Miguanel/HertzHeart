from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from .models import SharedProject
from .serializers import ShareCreateSerializer


class ShareCreateView(APIView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "share_create"

    def post(self, request):
        serializer = ShareCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        share = serializer.save()
        return Response({"slug": share.slug, "path": f"/s/{share.slug}"}, status=status.HTTP_201_CREATED)


class ShareDetailView(APIView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "share_read"

    def get(self, request, slug: str):
        share = get_object_or_404(SharedProject, slug=slug)
        SharedProject.objects.filter(pk=share.pk).update(last_accessed_at=timezone.now())
        return Response({"slug": share.slug, "title": share.title, "data": share.data, "createdAt": share.created_at})
