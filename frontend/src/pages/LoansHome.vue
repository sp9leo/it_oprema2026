<template>
  <div>
    <h2 class="text-2xl font-semibold text-gray-800 mb-6">Device Loans</h2>
    <p class="text-gray-500 mb-8">Browse available devices for borrowing or check your existing loans.</p>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <router-link to="/loans/browse" class="block rounded-lg border bg-white p-6 hover:shadow-md transition-shadow">
        <div class="flex items-center gap-4 mb-3">
          <div class="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
            <svg viewBox="0 0 24 24" class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <div>
            <h3 class="text-lg font-medium">Browse Bookable Devices</h3>
            <p class="text-sm text-gray-500">Search and book devices for a date range</p>
          </div>
        </div>
      </router-link>

      <router-link to="/loans/my" class="block rounded-lg border bg-white p-6 hover:shadow-md transition-shadow">
        <div class="flex items-center gap-4 mb-3">
          <div class="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center text-green-700">
            <svg viewBox="0 0 24 24" class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div>
            <h3 class="text-lg font-medium">My Loans</h3>
            <p class="text-sm text-gray-500">View and manage your current loans</p>
          </div>
        </div>
      </router-link>
    </div>
  </div>
</template>
