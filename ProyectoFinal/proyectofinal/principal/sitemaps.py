from django.contrib.sitemaps import Sitemap
from django.urls import reverse


class StaticViewSitemap(Sitemap):
    priority = 0.6
    changefreq = 'weekly'

    def items(self):
        return ['inicio', 'productos_todos', 'productos_hombre', 'productos_mujer', 'contacto']

    def location(self, item):
        return reverse(item)
