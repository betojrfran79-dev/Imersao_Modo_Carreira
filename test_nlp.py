import sys
from fcm_resolver import parse_natural_language_scout_query

test_phrases = [
    'atacantes com over ate 75',
    'atacante ate 75 de over',
    'atacante ate 75',
    'atacante maximo 75 de over',
    'atacantes com no maximo 75 de over',
    'atacante com overall ate 75',
    'atacante com overall de ate 75',
    'atacante com over menor que 75',
    'atacante abaixo de 75 de over',
    'atacante de 70 a 75 de over',
    'atacante com over entre 70 e 75',
    'atacante com over 75',
    'atacante over 75',
    'atacante com no maximo 75 de overall',
    'quero um atacante rapido com over ate 72',
    'me indica um zagueiro ate 78 de over',
    'laterais esquerdos com mais de 70 e ate 75 de over',
    'atacantes com over de ate 75',
    'atacante com nota ate 75',
    'atacantes ate 75 de geral',
    'goleiro de no maximo 74',
    'volante de 70 de over',
    'meia com overall menor que 80',
    'ponta com over ate 70',
]

for p in test_phrases:
    res = parse_natural_language_scout_query(p)
    mn = res.get('min_ovr')
    mx = res.get('max_ovr')
    pos = res.get('positions')
    gen = res.get('gender')
    print(f"{p:<55} -> min: {mn}, max: {mx}, pos: {pos}, gender: {gen}")
