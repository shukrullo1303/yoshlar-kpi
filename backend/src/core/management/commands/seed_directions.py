from django.core.management.base import BaseCommand
from src.core.models import KPIDirection

DIRECTIONS = [
    {
        'key': '1_ijro',
        'label': 'Ijro intizomi',
        'order': 1,
        'admin_scored': True,
        'is_uploadable': False,
        'default_target': 0,
    },
    {
        'key': '2_balans',
        'label': 'Yoshlar balansi',
        'order': 2,
        'admin_scored': False,
        'is_uploadable': True,
        'default_target': 1,
    },
    {
        'key': '3_bandlik',
        'label': 'Yoshlar bandligi',
        'order': 3,
        'admin_scored': False,
        'is_uploadable': True,
        'default_target': 3,
    },
    {
        'key': '4_bosh_vaqt',
        'label': 'Bo\'sh vaqtni tashkil etish',
        'order': 4,
        'admin_scored': False,
        'is_uploadable': True,
        'default_target': 2,
    },
    {
        'key': '5_profilaktika',
        'label': 'Huquqbuzarlik profilaktikasi',
        'order': 5,
        'admin_scored': False,
        'is_uploadable': True,
        'default_target': 2,
    },
    {
        'key': '6_murojaat',
        'label': 'Murojaatlar bilan ishlash',
        'order': 6,
        'admin_scored': False,
        'is_uploadable': True,
        'default_target': 1,
    },
    {
        'key': '7_brend',
        'label': 'Yoshlar brendi',
        'order': 7,
        'admin_scored': False,
        'is_uploadable': True,
        'default_target': 2,
    },
    {
        'key': '8_talim',
        'label': 'Ta\'lim va kasbiy rivojlanish',
        'order': 8,
        'admin_scored': False,
        'is_uploadable': True,
        'default_target': 1,
    },
    {
        'key': '9_startap',
        'label': 'Startap va tadbirkorlik',
        'order': 9,
        'admin_scored': False,
        'is_uploadable': True,
        'default_target': 1,
    },
    {
        'key': '10_nomenklatura',
        'label': 'Nomenklatura',
        'order': 10,
        'admin_scored': True,
        'is_uploadable': False,
        'default_target': 0,
    },
]


class Command(BaseCommand):
    help = '10 ta KPI yo\'nalishlarini yaratadi'

    def handle(self, *args, **kwargs):
        created_count = 0
        updated_count = 0

        for data in DIRECTIONS:
            obj, created = KPIDirection.objects.update_or_create(
                key=data['key'],
                defaults=data,
            )
            if created:
                created_count += 1
                self.stdout.write(f"  + {obj}")
            else:
                updated_count += 1
                self.stdout.write(f"  ~ {obj}")

        self.stdout.write(self.style.SUCCESS(
            f'\nTugadi: {created_count} ta yangi, {updated_count} ta yangilandi.'
        ))
