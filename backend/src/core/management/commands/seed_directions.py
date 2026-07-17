from django.core.management.base import BaseCommand
from src.core.models import KPIDirection

DIRECTIONS = [
    {
        'key': '1_ijro',
        'label': 'Ijro intizomi',
        'max_score': 20,
        'order': 1,
        'admin_scored': True,
        'is_uploadable': False,
        'default_target': 0,
    },
    {
        'key': '2_balans',
        'label': 'Yoshlar balansi',
        'max_score': 5,
        'order': 2,
        'admin_scored': False,
        'is_uploadable': True,
        'default_target': 1,
    },
    {
        'key': '3_bandlik',
        'label': 'Yoshlar bandligi',
        'max_score': 15,
        'order': 3,
        'admin_scored': False,
        'is_uploadable': True,
        'default_target': 3,
    },
    {
        'key': '4_bosh_vaqt',
        'label': 'Bo\'sh vaqtni tashkil etish',
        'max_score': 15,
        'order': 4,
        'admin_scored': False,
        'is_uploadable': True,
        'default_target': 2,
    },
    {
        'key': '5_profilaktika',
        'label': 'Huquqbuzarlik profilaktikasi',
        'max_score': 10,
        'order': 5,
        'admin_scored': False,
        'is_uploadable': True,
        'default_target': 2,
    },
    {
        'key': '6_murojaat',
        'label': 'Murojaatlar bilan ishlash',
        'max_score': 5,
        'order': 6,
        'admin_scored': False,
        'is_uploadable': True,
        'default_target': 1,
    },
    {
        'key': '7_brend',
        'label': 'Yoshlar brendi',
        'max_score': 10,
        'order': 7,
        'admin_scored': False,
        'is_uploadable': True,
        'default_target': 2,
    },
    {
        'key': '8_talim',
        'label': 'Ta\'lim va kasbiy rivojlanish',
        'max_score': 5,
        'order': 8,
        'admin_scored': False,
        'is_uploadable': True,
        'default_target': 1,
    },
    {
        'key': '9_startap',
        'label': 'Startap va tadbirkorlik',
        'max_score': 5,
        'order': 9,
        'admin_scored': False,
        'is_uploadable': True,
        'default_target': 1,
    },
    {
        'key': '10_nomenklatura',
        'label': 'Nomenklatura',
        'max_score': 10,
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
