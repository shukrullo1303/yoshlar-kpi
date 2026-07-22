import json
import time
import urllib.parse
import urllib.request

from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

WIALON_BASE  = 'https://2.wialon.uz/wialon/ajax.html'
WIALON_TOKEN = '21efdc1c105a00b80ffd56e11497ebd3386FEC1C440F04DFC0CDB73A068B1333D3FB7EB6'

_sid_cache   = {'sid': None, 'ts': 0}
SID_TTL      = 300  # 5 daqiqa


def _wialon(svc, params, sid=None):
    p = {'svc': svc, 'params': json.dumps(params)}
    if sid:
        p['sid'] = sid
    url = WIALON_BASE + '?' + urllib.parse.urlencode(p)
    with urllib.request.urlopen(url, timeout=10) as r:
        return json.loads(r.read().decode())


def _get_sid():
    now = time.time()
    if _sid_cache['sid'] and now - _sid_cache['ts'] < SID_TTL:
        return _sid_cache['sid']
    data = _wialon('token/login', {'token': WIALON_TOKEN, 'fl': 1})
    sid = data.get('eid')
    if sid:
        _sid_cache['sid'] = sid
        _sid_cache['ts'] = now
    return sid


class WialonVehiclesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            sid = _get_sid()
            if not sid:
                return Response({'error': 'Wialon login muvaffaqiyatsiz'}, status=503)

            data = _wialon('core/search_items', {
                'spec': {
                    'itemsType': 'avl_unit',
                    'propName': 'sys_name',
                    'propValueMask': '*',
                    'sortType': 'sys_name',
                },
                'force': 1,
                'flags': 1025,
                'from': 0,
                'to': 500,
            }, sid=sid)

            if 'error' in data:
                _sid_cache['sid'] = None
                return Response({'error': f"Wialon xato: {data['error']}"}, status=503)

            vehicles = []
            for item in data.get('items', []):
                pos = item.get('pos')
                vehicles.append({
                    'id':        item['id'],
                    'name':      item['nm'],
                    'latitude':  pos['y'] if pos else None,
                    'longitude': pos['x'] if pos else None,
                    'speed':     pos['s'] if pos else 0,
                    'time':      pos['t'] if pos else None,
                    'course':    pos.get('c', 0) if pos else 0,
                })

            return Response(vehicles)

        except Exception as e:
            _sid_cache['sid'] = None
            return Response({'error': str(e)}, status=503)
