import random
import re
import unicodedata
from datetime import date
from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from src.core.models import Profile, KPITask


def slugify_mfy(name):
    """MFY nomini username ga aylantiradi: 'Boʼzariq' → 'bozariq'"""
    # Unicode normalize qilish (kompozit belgilarni ajratish)
    name = unicodedata.normalize('NFKD', name)
    # Maxsus Uzbek belgilarni olib tashlash (ʼ ʻ ʽ ʾ " ')
    name = re.sub(r"[ʼʻʽʾʹ''`\"ʺ]", '', name)
    # Kichik harfga
    name = name.lower()
    # Nuqta, tire, bo'shliqni underscore ga
    name = re.sub(r'[\s\-\.]+', '_', name)
    # Faqat lotin harf, raqam, underscore qolsin
    name = re.sub(r'[^a-z0-9_]', '', name)
    # Ketma-ket underscorelarni birlashtirish
    name = re.sub(r'_+', '_', name).strip('_')
    return name

MAHALLALAR = [
    "A. Temur", "Argʼin", "Axtachi", "Baraka", "Bahrin",
    "Baynalminal", "Beklar", "Beruniy", "Birdamlik", "Bobur",
    "Bozorboshi", "Boʼzariq", "Chek", "Choʼntak", "Dasturxonchi",
    "Devatagi", "Doʼrmon", "Doʼstlik", "Elash qipchoq", "Ergashobod",
    "Farovon", "Fayz", "Fayziobod", "Fidokor", "Gʺnchayuz",
    "Gumbaz", "Hamdoʼstlik", "Ibn Sino", "Istiqlol", "Kamolot",
    "Koʼrkam", "Kujgan", "Labgardon", "Marqayuz", "Mehnatobod",
    "Mirzaobod", "Muqumiy", "Mustahkam", "Namuna-Boʼston", "Navbaxor",
    "Navkan", "Navoiy", "Neʼmatobod", "Niyozbotir", "Nurafshon",
    "Obod", "Olaqanot", "Oqboʼyra", "Otish", "Oʼzbekiston",
    "Ozod", "Qadim", "Qadriyat", "Qashqar", "Qayragʼoch",
    "Qipchoq", "Qoʼngʼgirot", "Qoraqiy", "Qurama", "Saydobod",
    "Shodlik", "Shoʼrkishloq", "Tajriba", "Toshtepa", "Turon",
    "Tuvodoq", "Uchtosh", "Ulugʼbek", "Ungut", "Xonaka",
    "Yangiobod", "Yangisor", "Yuksalish", "Yuqori boʼz", "Yuqori Kujgan",
    "Zanken",
]

MAX_SCORES = {
    '1_ijro': 20, '2_balans': 5, '3_bandlik': 15, '4_bosh_vaqt': 15,
    '5_profilaktika': 10, '6_murojaat': 5, '7_brend': 10, '8_talim': 5,
    '9_startap': 5, '10_nomenklatura': 10,
}

DIRECTION_KEYS = list(MAX_SCORES.keys())
MONTH = date(2026, 7, 1)


class Command(BaseCommand):
    help = 'Seed initial data'

    def handle(self, *args, **kwargs):
        # Superuser
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser('admin', 'admin@example.com', 'admin1234')
            self.stdout.write(self.style.SUCCESS('Superuser yaratildi: admin / admin1234'))
        else:
            self.stdout.write('Superuser mavjud: admin')

        # Eski mfy_XX userlarni o'chirish
        old_count = User.objects.filter(username__regex=r'^mfy_\d+$').count()
        if old_count:
            User.objects.filter(username__regex=r'^mfy_\d+$').delete()
            self.stdout.write(f'Eski {old_count} ta mfy_XX user ochirildi')

        profiles_created = 0
        tasks_created = 0

        for i, mahalla in enumerate(MAHALLALAR, start=1):
            username = slugify_mfy(mahalla)
            user, user_created = User.objects.get_or_create(username=username)
            if user_created:
                user.set_password('mfy1234')
                user.save()

            profile, prof_created = Profile.objects.get_or_create(
                user=user,
                defaults={'mahalla_name': mahalla, 'district': 'Asaka'}
            )
            if not prof_created and profile.mahalla_name != mahalla:
                profile.mahalla_name = mahalla
                profile.save()

            if prof_created:
                profiles_created += 1

            self.stdout.write(f'  [{i:02d}/76] {username} OK')

            # 3 ta tasdiqlangan task
            random.seed(profile.id)
            chosen_dirs = random.sample(DIRECTION_KEYS, 3)
            for dir_key in chosen_dirs:
                max_s = MAX_SCORES[dir_key]
                score = round(random.uniform(max_s * 0.5, max_s), 1)
                _, created = KPITask.objects.get_or_create(
                    leader=profile,
                    direction=dir_key,
                    month=MONTH,
                    status='yashil',
                    defaults={'score': score}
                )
                if created:
                    tasks_created += 1

        self.stdout.write(self.style.SUCCESS(
            f'\nSeed tugadi: {profiles_created} profil, {tasks_created} task yaratildi.'
        ))
