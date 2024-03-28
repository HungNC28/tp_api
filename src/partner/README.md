## Tích hợp hệ thống

### Biến môi trường
- Base URL: `BASE_URL=api.dulieuthuyloivietnam.com/v1/partner`
- Access Token: `ACCESS_TOKEN=`
- Mã khu vực: `ZONE_ID`

### Danh sách chỉ số
```sh
curl --header 'Authorization: Bearer $ACCESS_TOKEN' \
    --url '$BASE_URL/metric/list'
```

### Thông tin dự án
```sh
ZONE_ID=
curl --header 'Authorization: Bearer $ACCESS_TOKEN' \
    --url '$BASE_URL/zone/get?id=$ZONE_ID'
```

### Thông tin trạm đo
```sh
BOX_ID=
curl --header 'Authorization: Bearer $ACCESS_TOKEN' \
    --url '$BASE_URL/box/get?id=$BOX_ID'
```

### Dữ liệu nhận từ cảm biến

```sh
BOX_ID=
curl --header 'Authorization: Bearer $ACCESS_TOKEN' \
  --url '$BASE_URL/sensor/data?box_id=$BOX_ID'
```
Cấu trúc dữ liệu trả về
```json
[
	{
		"ts": 1639378871,
		"water": 1.0171,
		"water_do": 0.3935,
		"salt": 0.9683
	},
	{
		"ts": 1639378271,
		"water": 0.9705,
		"water_do": 0.3902,
		"salt": 0.9714
	},
	{
		"ts": 1639377671,
		"water": 1.0166,
		"water_do": 0.3834,
		"salt": 0.9792
	}
]
```
Trong đó:
- `ts` là timestamp ghi nhận mẫu
- các tham số còn lại là giá trị của chỉ số
Tham khảo các chỉ số này tại mục **Danh sách chỉ số**

