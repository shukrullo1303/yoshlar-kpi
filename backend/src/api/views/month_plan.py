from rest_framework.response import Response
from rest_framework import status
from src.core.models import KPIMonthPlan, KPIDirection
from .base import BaseAdminAPIView


class AdminMonthPlanView(BaseAdminAPIView):
    """
    GET  ?direction=4_bosh_vaqt&month=2026-07-01
    POST {direction, month, target_count?, plan_dates?}
         plan_dates takes priority: target_count = len(plan_dates)
    """

    def get(self, request):
        direction = request.query_params.get('direction')
        month = request.query_params.get('month')

        if not direction or not month:
            return Response({'error': 'direction va month kerak'}, status=status.HTTP_400_BAD_REQUEST)

        plan = KPIMonthPlan.objects.filter(direction_key=direction, month=month).first()
        max_score = None
        default_target = 0
        try:
            dir_obj = KPIDirection.objects.get(key=direction)
            max_score = dir_obj.max_score
            default_target = dir_obj.default_target
        except KPIDirection.DoesNotExist:
            pass

        plan_dates_data = plan.plan_dates if plan else []
        if plan and plan_dates_data:
            recalc = sum(
                int(item.get('count', 1)) if isinstance(item, dict) else 1
                for item in plan_dates_data
            )
            target_count_out = recalc
        else:
            target_count_out = plan.target_count if plan else None

        return Response({
            'direction': direction,
            'month': month,
            'target_count': target_count_out,
            'plan_dates': plan_dates_data,
            'max_score': max_score,
            'default_target': default_target,
        })

    def post(self, request):
        direction = request.data.get('direction')
        month = request.data.get('month')
        plan_dates = request.data.get('plan_dates')
        target_count = request.data.get('target_count')

        if not direction or not month:
            return Response({'error': 'direction va month kerak'}, status=status.HTTP_400_BAD_REQUEST)

        # plan_dates takes priority over target_count
        if plan_dates is not None:
            if not isinstance(plan_dates, list):
                return Response({'error': 'plan_dates array bolishi kerak'}, status=status.HTTP_400_BAD_REQUEST)
            # Each entry: {date, count} — sum all counts for total target
            target_count = sum(
                int(item.get('count', 1)) if isinstance(item, dict) else 1
                for item in plan_dates
            )
            if target_count < 1:
                return Response({'error': 'Kamida bitta sana tanlang'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            plan_dates = []
            if target_count is None:
                return Response({'error': 'plan_dates yoki target_count kerak'}, status=status.HTTP_400_BAD_REQUEST)
            try:
                target_count = int(target_count)
                if target_count < 1:
                    raise ValueError
            except (TypeError, ValueError):
                return Response({'error': 'target_count musbat son bolishi kerak'}, status=status.HTTP_400_BAD_REQUEST)

        plan, created = KPIMonthPlan.objects.update_or_create(
            direction_key=direction,
            month=month,
            defaults={'target_count': target_count, 'plan_dates': plan_dates},
        )

        max_score = None
        try:
            dir_obj = KPIDirection.objects.get(key=direction)
            max_score = dir_obj.max_score
        except KPIDirection.DoesNotExist:
            pass

        return Response({
            'direction': direction,
            'month': month,
            'target_count': plan.target_count,
            'plan_dates': plan.plan_dates,
            'max_score': max_score,
            'created': created,
        })
