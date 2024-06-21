from serial import Serial
from pyrtcm import RTCMReader
with Serial('/dev/ttyUSB0', 115200, timeout=3) as stream:
  while True :
    rtr = RTCMReader(stream)
    raw_data, parsed_data = rtr.read()
    if parsed_data is not None:
      print('::parsed_data=<',parsed_data,'>')