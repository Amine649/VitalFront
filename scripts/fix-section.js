const fs = require('fs');
const path = 'src/app/components/espace-proprietaire/espace-proprietaire.component.html';
let content = fs.readFileSync(path, 'utf8');

const oldBlock = `      <div class="mx-auto">
        <div class="flex flex-col md:flex-row items-start gap-4 md:gap-6">
         <div [ngClass]="selectedCategory === 'Chat' ? 'bg-[#74C375]' : selectedCategory === 'Chien' ? 'bg-[#a01867]' : 'bg-blue-600'" class="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center mx-auto md:mx-0">
            <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div class="flex-1 ">
            <h3 class="subheading-fixed font-bold mb-4" style="color: #42636E; line-height: 1.3;">`;

const newBlock = `      <div class="mx-auto">
        <!-- Icon + Title row -->
        <div class="flex items-start gap-4 md:gap-6 mb-4">
          <div [ngClass]="selectedCategory === 'Chat' ? 'bg-[#74C375]' : selectedCategory === 'Chien' ? 'bg-[#a01867]' : 'bg-blue-600'" class="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center">
            <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div class="flex-1">
            <h3 class="subheading-fixed font-bold" style="color: #42636E; line-height: 1.3;">`;

if (content.includes(oldBlock)) {
  content = content.replace(oldBlock, newBlock);
  // Also close the flex row after h3 and move paragraphs outside
  const oldClose = `            </h3>
            <p class="text-lg text-gray-700 leading-relaxed text-justify" *ngIf="selectedCategory === 'Chat'">`;
  const newClose = `            </h3>
          </div>
        </div>
        <!-- Paragraph full width below -->
        <p class="text-lg text-gray-700 leading-relaxed text-justify" *ngIf="selectedCategory === 'Chat'">`;
  content = content.replace(oldClose, newClose);

  const oldChienClose = `            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Section 2: Points clés -->`;
  const newChienClose = `        </p>
      </div>
    </div>

    <!-- Section 2: Points clés -->`;
  content = content.replace(oldChienClose, newChienClose);

  fs.writeFileSync(path, content, 'utf8');
  console.log('Done');
} else {
  console.log('Block not found');
}
