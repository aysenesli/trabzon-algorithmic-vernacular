# Trabzon Vernacular Explorer v1.5.0

Photo-free static GitHub Pages release. No build or package installation is required.

## GitHub yükleme

1. ZIP dosyasını açın. `index.html`, `assets`, `src`, `data` ve `.nojekyll` dosyalarını mevcut GitHub deposunun köküne yerleştirin; ZIP dosyasının kendisini yüklemeyin.
2. **Eski `assets/inventory-cases/` klasörünü ve `data/documented-cases.js` dosyasını depodan silin.** Yeni dosyaları yüklemek eski fotoğrafları kendiliğinden silmez. Depoda başka envanter fotoğraf klasörleri varsa onları da kaldırın.
3. Mevcut GitHub Pages yayın dalında değişiklikleri kaydedin. `index.html` depo kökünde kalmalıdır.
4. Yayın sonrasında sayfayı sert yenileyin (Ctrl+F5).

## Bu sürüm

- 183 analiz kaydı ve 12 parametre korunmuştur. 30 vakalık galeri ve bu galeriye ait kod, fotoğraf dosyaları ve görsel bağlantıları kaldırılmıştır. Bu 30 kaydın korpus içindeki satırları silinmemiştir.
- Kayıt kodları, bölgeler, kaynak sayfa bilgileri, P1/P8/P9 ve kaynak açıklamaları korunmuştur.
- Tarihsel örneklem inceleme alanları bu yayın kopyasında raporlanmamaktadır. Kayıtlara yeni bir doğrulama durumu atanmadı. Kodlanmış bir alan, bağımsız doğrulama anlamına gelmez.
- Design Explorer, Evidence Explorer, Method & Limits, CSV ve JSON dışa aktarımları korunmuştur.
- P2–P7 ve P10–P12 ölçülmüş bina verisi değildir; şematik çizim girdileridir. Fotoğrafların kaldırılması kaynak veriye yeni doğrulama sağlamaz.

## Kaynak

ÖZEN, H., TULUK, Ö.İ., ENGİN, H.E., DÜZENLİ, H.İ., SÜMERKAN, M.R., TUTKUN, M., ÜSTÜN DEMİRKAYA, F. AND KELEŞ, S., 2010. Trabzon kent içi kültür varlıkları envanteri. Trabzon: T.C. Trabzon Valiliği İl Kültür ve Turizm Müdürlüğü.

Sayfa konumları çalışma PDF'sine göredir. Envanter kitabının PDF'si veya fotoğrafları bu pakette dağıtılmamaktadır.

## Yerel inceleme

`index.html` tarayıcıda doğrudan açılabilir. İstenirse klasörde `python3 -m http.server 8000` çalıştırılıp http://localhost:8000 adresi açılabilir.
