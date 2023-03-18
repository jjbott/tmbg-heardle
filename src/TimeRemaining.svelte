<script>
    let timeRemaining = "",
        s = new Date(),
        i = 3600 * (23 - s.getHours()) + 60 * (59 - s.getMinutes()) + (59 - s.getSeconds());

    setInterval(() => {
        let e = Math.floor(i / 3600),
            t = Math.floor((i - 3600 * e) / 60),
            s = Math.floor(i % 60);
        timeRemaining = ("00" + e).slice(-2) + ":" + ("00" + t).slice(-2) + ":" + ("00" + s).slice(-2);
        i--;
        0 == e && 0 == t && 0 == s && location.reload(!0);
    }, 1000);
</script>

<div class="tracking-widest text-lg">
    {timeRemaining}
</div>
