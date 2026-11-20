let state = {
    activePage: 'sat',
    sat: { cash: 5000, drop: 0, completed: {} },
    core: { cash: 20000, drop: 0, completed: {} }
};

function loadState() {
    const saved = localStorage.getItem('crash_navigator_simple_v2');
    if (saved) {
        const parsed = JSON.parse(saved);
        state.activePage = parsed.activePage || 'sat';
        state.sat = { cash: 5000, drop: 0, completed: {}, ...parsed.sat };
        state.core = { cash: 20000, drop: 0, completed: {}, ...parsed.core };
    }
    ['sat', 'core'].forEach(bucket => {
        document.getElementById(`${bucket}-cash`).value = state[bucket].cash;
        document.getElementById(`${bucket}-drop`).value = state[bucket].drop;
        drawTable(bucket);
    });
    switchPage(state.activePage);
}

function save() {
    localStorage.setItem('crash_navigator_simple_v2', JSON.stringify(state));
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

function toggleComplete(bucket, dropKey, isChecked) {
    if (isChecked) {
        state[bucket].completed[dropKey] = true;
    } else {
        delete state[bucket].completed[dropKey];
    }
    save();
    drawTable(bucket);
}

function clearChecks(bucket) {
    state[bucket].completed = {};
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
    const completed = state[bucket].completed || {};

    let prevTarget = 0;
    let target = 0;
    let i = 0;
    let totalDeployed = 0;

    while (target < 100 && i < 40) {
        const curDrop = parseFloat((startDrop + (i * 2)).toFixed(1));
        const dropKey = String(curDrop);
        const isDone = Boolean(completed[dropKey]);

        target = Math.min(100, calc(curDrop));
        const incrementPct = target - prevTarget;
        const deployNow = (incrementPct / 100) * cash;
        const cumulative = (target / 100) * cash;

        if (isDone && deployNow > 0) {
            totalDeployed += deployNow;
        }

        if (deployNow >= 0) {
            tbody.innerHTML += `<tr class="${isDone ? 'is-done' : ''}">
                <td class="text-center">
                    <input type="checkbox" class="deploy-check" ${isDone ? 'checked' : ''} onchange="toggleComplete('${bucket}', '${dropKey}', this.checked)">
                </td>
                <td class="text-white">-${curDrop}%</td>
                <td>${target.toFixed(1)}%</td>
                <td class="text-right ${bucket === 'core' ? 'text-emerald' : 'text-sky'}">${fmt(deployNow)}</td>
                <td class="text-right text-muted">${fmt(cumulative)}</td>
            </tr>`;
        }
        prevTarget = target;
        i++;
    }

    const remainingCash = Math.max(0, cash - totalDeployed);
    document.getElementById(`${bucket}-deployed`).textContent = fmt(totalDeployed);
    document.getElementById(`${bucket}-remaining`).textContent = fmt(remainingCash);
}

loadState();
