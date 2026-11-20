let state = {
    activePage: 'sat',
    sat: { cash: 5000, drop: 0 },
    core: { cash: 20000, drop: 0 }
};

function loadState() {
    const saved = localStorage.getItem('crash_navigator_simple_v1');
    if (saved) {
        state = { ...state, ...JSON.parse(saved) };
    }
    ['sat', 'core'].forEach(bucket => {
        document.getElementById(`${bucket}-cash`).value = state[bucket].cash;
        document.getElementById(`${bucket}-drop`).value = state[bucket].drop;
        drawTable(bucket);
    });
    switchPage(state.activePage);
}

function save() {
    localStorage.setItem('crash_navigator_simple_v1', JSON.stringify(state));
}

function switchPage(page) {
    state.activePage = page;
    save();
    document.querySelectorAll('.page-view').forEach(el => el.classList.remove('is-active'));
    document.getElementById('page-' + page).classList.add('is-active');

    document.getElementById('tab-sat').className = 'nav-btn' + (page === 'sat' ? ' active-sat' : '');
    document.getElementById('tab-core').className = 'nav-btn' + (page === 'core' ? ' active-core' : '');
}

function update(bucket) {
    state[bucket].cash = parseFloat(document.getElementById(`${bucket}-cash`).value) || 0;
    state[bucket].drop = parseFloat(document.getElementById(`${bucket}-drop`).value) || 0;
    save();
    drawTable(bucket);
}

function calc(d) {
    return d < 27 ? d + 10 : (2.75 * d) - 25.64;
}

function fmt(num) {
    return '$' + num.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function drawTable(bucket) {
    const tbody = document.getElementById(`${bucket}-out`);
    tbody.innerHTML = '';
    const startDrop = state[bucket].drop;
    const cash = state[bucket].cash;

    let prevTarget = 0;
    let target = 0;
    let i = 0;

    while (target < 100 && i < 40) {
        const curDrop = parseFloat((startDrop + (i * 2)).toFixed(1));
        target = Math.min(100, calc(curDrop));
        const incrementPct = target - prevTarget;
        const deployNow = (incrementPct / 100) * cash;
        const cumulative = (target / 100) * cash;

        if (deployNow >= 0) {
            tbody.innerHTML += `<tr>
                <td class="text-white">-${curDrop}%</td>
                <td>${target.toFixed(1)}%</td>
                <td class="text-right ${bucket === 'core' ? 'text-emerald' : 'text-sky'}">${fmt(deployNow)}</td>
                <td class="text-right text-muted">${fmt(cumulative)}</td>
            </tr>`;
        }
        prevTarget = target;
        i++;
    }
}

loadState();
