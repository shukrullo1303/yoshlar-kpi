from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView
from django.views.static import serve as static_serve

FRONTEND_DIST = getattr(settings, 'FRONTEND_DIST', None)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('src.api.main_urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

if FRONTEND_DIST and FRONTEND_DIST.exists():
    urlpatterns += [
        re_path(r'^assets/(?P<path>.*)$', static_serve, {'document_root': FRONTEND_DIST / 'assets'}),
        re_path(r'^(?P<path>favicon\.svg|icons\.svg)$', static_serve, {'document_root': FRONTEND_DIST}),
        re_path(r'^(?!admin/|api/|media/).*$', TemplateView.as_view(template_name='index.html')),
    ]
