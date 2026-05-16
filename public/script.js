const fileInput = document.getElementById('fileInput');
const submitBtn = document.getElementById('submitBtn');
const fileName = document.getElementById('fileName');
const loader = document.getElementById('loader');
const loaderText = document.getElementById('loaderText');
const results = document.getElementById('results');
const summaryOutput = document.getElementById('summaryOutput');
const transcriptOutput = document.getElementById('transcriptOutput');

fileInput.addEventListener('change', () => {
  if (fileInput.files.length > 0) {
    fileName.textContent = fileInput.files[0].name;
    submitBtn.disabled = false;
  }
});

function switchTab(tab) {
  const uploadSection = document.getElementById('uploadSection');
  const urlSection = document.getElementById('urlSection');
  const tabUpload = document.getElementById('tabUpload');
  const tabUrl = document.getElementById('tabUrl');

  if (tab === 'upload') {
    uploadSection.style.display = 'block';
    urlSection.style.display = 'none';
    tabUpload.classList.add('active');
    tabUrl.classList.remove('active');
  } else {
    uploadSection.style.display = 'none';
    urlSection.style.display = 'block';
    tabUpload.classList.remove('active');
    tabUrl.classList.add('active');
  }

  results.style.display = 'none';
}

function showLoader() {
  results.style.display = 'none';
  loader.style.display = 'block';
}

function hideLoader() {
  loader.style.display = 'none';
}

function showResults(data) {
  summaryOutput.innerHTML = data.summary
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '• $1');

  transcriptOutput.innerHTML = data.transcript
    .replace(/([.!?])\s+/g, '$1<br><br>');

  results.style.display = 'flex';
}

async function handleSubmit() {
  const file = fileInput.files[0];
  if (!file) return;

  showLoader();
  submitBtn.disabled = true;
  loaderText.textContent = 'Extracting audio from video...';

  const formData = new FormData();
  formData.append('video', file);

  try {
    setTimeout(() => loaderText.textContent = 'Transcribing audio with Whisper AI...', 3000);
    setTimeout(() => loaderText.textContent = 'Generating summary with LLaMA 3...', 8000);

    const response = await fetch('http://localhost:3000/summarize', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    if (data.success) {
      showResults(data);
    } else {
      alert('Error: ' + data.error);
    }

  } catch (error) {
    alert('Something went wrong. Make sure the server is running.');
    console.error(error);

  } finally {
    hideLoader();
    submitBtn.disabled = false;
  }
}

async function handleURLSubmit() {
  const url = document.getElementById('urlInput').value.trim();
  if (!url) return alert('Please paste a URL first.');

  showLoader();
  loaderText.textContent = 'Downloading audio from URL...';

  try {
    setTimeout(() => loaderText.textContent = 'Transcribing audio with Whisper AI...', 5000);
    setTimeout(() => loaderText.textContent = 'Generating summary with LLaMA 3...', 15000);

    const response = await fetch('http://localhost:3000/summarize-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });

    const data = await response.json();
    if (data.success) {
      showResults(data);
    } else {
      alert('Error: ' + data.error);
    }

  } catch (error) {
    alert('Something went wrong. Make sure the server is running.');
    console.error(error);

  } finally {
    hideLoader();
  }
}