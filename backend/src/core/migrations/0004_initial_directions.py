from django.db import migrations
from django.utils import timezone

INITIAL_DIRECTIONS = [
    {
        'key': '1_ijro',
        'label': 'Ijro intizomi',
        'max_score': 20,
        'order': 1,
        'admin_scored': True,
        'is_uploadable': False,
        'info': 'Har ish kunida admin tomonidan baholanadi. Ishga kelish tartib-intizomi.',
        'how': "Yuklash shart emas — admin kunlik qayd qiladi.",
        'is_active': True,
    },
    {
        'key': '2_balans',
        'label': 'Yoshlar balansi',
        'max_score': 5,
        'order': 2,
        'admin_scored': False,
        'is_uploadable': True,
        'info': "Yoshlar balansi ro'yxati va yangilanishlarini tasdiqlang.",
        'how': "Ro'yxat, raqam va hujjat fayllarini yuklang.",
        'is_active': True,
    },
    {
        'key': '3_bandlik',
        'label': 'Yoshlar bandligi',
        'max_score': 15,
        'order': 3,
        'admin_scored': False,
        'is_uploadable': True,
        'info': 'Yoshlarni ishga joylashtirganligi haqida hisobot.',
        'how': "Ish joyiga yo'llanma, buyruq yoki tasdiqlash xatini yuklang.",
        'is_active': True,
    },
    {
        'key': '4_bosh_vaqt',
        'label': "Bo'sh vaqtni mazmunli tashkil etish",
        'max_score': 15,
        'order': 4,
        'admin_scored': False,
        'is_uploadable': True,
        'info': 'Sport, madaniy, ijodiy tadbirlar tashkillashtirish.',
        'how': "Tadbir surat va videosi, ishtirokchilar ro'yxatini yuklang.",
        'is_active': True,
    },
    {
        'key': '5_profilaktika',
        'label': 'Ijtimoiy profilaktika',
        'max_score': 10,
        'order': 5,
        'admin_scored': False,
        'is_uploadable': True,
        'info': "Ijtimoiy xavfli holatlar oldini olish bo'yicha tadbirlar.",
        'how': 'Profilaktik suhbat bayonnomasini yoki PQ-1 hujjatini yuklang.',
        'is_active': True,
    },
    {
        'key': '6_murojaat',
        'label': 'Murojaatlar bilan ishlash',
        'max_score': 5,
        'order': 6,
        'admin_scored': False,
        'is_uploadable': True,
        'info': "Fuqarolar murojaatlariga o'z vaqtida javob berish.",
        'how': 'Murojaat va javob hujjatini yuklang.',
        'is_active': True,
    },
    {
        'key': '7_brend',
        'label': 'Brend loyihalar va shaxsiy rivojlanish',
        'max_score': 10,
        'order': 7,
        'admin_scored': False,
        'is_uploadable': True,
        'info': 'Brend loyihalar va shaxsiy rivojlanish tadbirlari.',
        'how': 'Loyiha tavsifi, surat va natijalarni yuklang.',
        'is_active': True,
    },
    {
        'key': '8_talim',
        'label': "Ta'lim muassasalaridagi yoshlar bilan ishlash",
        'max_score': 5,
        'order': 8,
        'admin_scored': False,
        'is_uploadable': True,
        'info': "Ta'lim muassasalaridagi yoshlar bilan ishlash natijalari.",
        'how': "O'quvchi ma'lumotlari va tasdiqlash hujjatini yuklang.",
        'is_active': True,
    },
    {
        'key': '9_startap',
        'label': 'Zamonaviy kasblar va startap loyihalar',
        'max_score': 5,
        'order': 9,
        'admin_scored': False,
        'is_uploadable': True,
        'info': "Zamonaviy kasblar va startap loyihalarni qo'llab-quvvatlash.",
        'how': 'Startap nomi, egasi va tasdiqlovchi hujjatni yuklang.',
        'is_active': True,
    },
    {
        'key': '10_nomenklatura',
        'label': 'Nomenklatura hujjatlar',
        'max_score': 10,
        'order': 10,
        'admin_scored': True,
        'is_uploadable': False,
        'info': "Nomenklatura hujjatlar to'g'ri yuritilishi oylik tekshiriladi.",
        'how': 'Hujjatlar admin tomonidan reja asosida tekshiriladi.',
        'is_active': True,
    },
]


def create_directions(apps, schema_editor):
    KPIDirection = apps.get_model('core', 'KPIDirection')
    now = timezone.now()
    for d in INITIAL_DIRECTIONS:
        KPIDirection.objects.get_or_create(
            key=d['key'],
            defaults={**d, 'created_at': now, 'updated_at': now}
        )


def delete_directions(apps, schema_editor):
    KPIDirection = apps.get_model('core', 'KPIDirection')
    KPIDirection.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0003_kpidirection_alter_kpitask_direction'),
    ]

    operations = [
        migrations.RunPython(create_directions, delete_directions),
    ]
