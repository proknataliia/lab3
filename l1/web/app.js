const getIpForm = document.getElementById("getIpForm");
const postIpForm = document.getElementById("postIpForm");
const getIpInput = document.getElementById("getIp");
const postIpInput = document.getElementById("postIp");
const getIpError = document.getElementById("getIpError");
const postIpError = document.getElementById("postIpError");
const healthBtn = document.getElementById("healthBtn");
const helpBtn = document.getElementById("helpBtn");
const clearBtn = document.getElementById("clearBtn");
const statusBox = document.getElementById("status");
const rawOutput = document.getElementById("rawOutput");
const ipData = document.getElementById("ipData");
const buttons = [...document.querySelectorAll("button")];

const resultFields = {
	ip: document.getElementById("resultIp"),
	country: document.getElementById("resultCountry"),
	region: document.getElementById("resultRegion"),
	city: document.getElementById("resultCity"),
	org: document.getElementById("resultOrg"),
	hostname: document.getElementById("resultHostname"),
};

getIpInput.addEventListener("input", () => validateIP(getIpInput, getIpError));
postIpInput.addEventListener("input", () => validateIP(postIpInput, postIpError));

helpBtn.addEventListener("click", () => requestJSON("/", "GET /"));
healthBtn.addEventListener("click", () => requestJSON("/health", "GET /health"));
clearBtn.addEventListener("click", clearResult);

getIpForm.addEventListener("submit", async (event) => {
	event.preventDefault();

	const ip = validateIP(getIpInput, getIpError);
	if (!ip) {
		setStatus("Виправте IP адресу перед відправкою.");
		return;
	}

	await requestJSON(`/api/ip/${encodeURIComponent(ip)}`, "GET /api/ip/:ip");
});

postIpForm.addEventListener("submit", async (event) => {
	event.preventDefault();

	const ip = validateIP(postIpInput, postIpError);
	if (!ip) {
		setStatus("Виправте IP адресу перед відправкою.");
		return;
	}

	await requestJSON("/api/ip", "POST /api/ip", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ ip }),
	});
});

function validateIP(input, output) {
	const value = input.value.trim();

	if (!value) {
		setFieldError(input, output, "Введіть IP адресу.");
		return "";
	}

	if (!isIPv4(value) && !isIPv6(value)) {
		setFieldError(input, output, "Введіть правильний IPv4 або IPv6.");
		return "";
	}

	input.classList.remove("invalid");
	output.textContent = "";
	return value;
}

function setFieldError(input, output, message) {
	input.classList.add("invalid");
	output.textContent = message;
}

function isIPv4(value) {
	const parts = value.split(".");
	if (parts.length !== 4) {
		return false;
	}

	return parts.every((part) => {
		if (!/^\d+$/.test(part)) {
			return false;
		}

		const number = Number(part);
		return number >= 0 && number <= 255 && String(number) === part;
	});
}

function isIPv6(value) {
	if (!value.includes(":") || !/^[0-9a-fA-F:]+$/.test(value)) {
		return false;
	}

	const doubleColonMatches = value.match(/::/g) || [];
	if (doubleColonMatches.length > 1) {
		return false;
	}

	const parts = value.split(":");
	if (doubleColonMatches.length === 0 && parts.length !== 8) {
		return false;
	}

	if (doubleColonMatches.length === 1 && parts.length > 8) {
		return false;
	}

	return parts.every((part) => part === "" || /^[0-9a-fA-F]{1,4}$/.test(part));
}

async function requestJSON(url, label, options = {}) {
	setBusy(true);
	setStatus(`${label}: надсилаємо запит...`);
	ipData.hidden = true;

	try {
		const response = await fetch(url, options);
		const data = await response.json();

		rawOutput.textContent = JSON.stringify(data, null, 2);
		setStatus(`${label}: HTTP ${response.status}`);

		if (!response.ok) {
			return;
		}

		if (data.ip || data.query) {
			showIPData(data);
		}
	} catch (error) {
		setStatus(`${label}: помилка запиту.`);
		rawOutput.textContent = error.message;
	} finally {
		setBusy(false);
	}
}

function showIPData(data) {
	resultFields.ip.textContent = data.ip || data.query || "-";
	resultFields.country.textContent = data.country || "-";
	resultFields.region.textContent = data.region || "-";
	resultFields.city.textContent = data.city || "-";
	resultFields.org.textContent = data.org || "-";
	resultFields.hostname.textContent = data.hostname || "-";
	ipData.hidden = false;
}

function clearResult() {
	setStatus("Оберіть ендпоінт для перевірки.");
	rawOutput.textContent = "";
	ipData.hidden = true;
	getIpInput.classList.remove("invalid");
	postIpInput.classList.remove("invalid");
	getIpError.textContent = "";
	postIpError.textContent = "";
}

function setStatus(message) {
	statusBox.textContent = message;
}

function setBusy(isBusy) {
	buttons.forEach((button) => {
		button.disabled = isBusy;
	});
}
