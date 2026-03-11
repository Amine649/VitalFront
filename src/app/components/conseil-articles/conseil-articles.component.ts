import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

interface Article {
  id: string;
  title: string;
  category: string;
  animal: string;
  content: string;
}

interface BlogPdfData {
  title: string;
  category: string;
  animal: string;
  pdfUrl: string;
  pet: string;
}

@Component({
  selector: 'app-conseil-articles',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './conseil-articles.component.html',
  styleUrls: ['./conseil-articles.component.scss']
})
export class ConseilArticlesComponent implements OnInit {
  article: Article | null = null;
  blogPdfData: BlogPdfData | null = null;
  pdfBlobUrl: string | null = null;
  safePdfUrl: SafeResourceUrl | null = null;
  isPdfLoading: boolean = false;
  isBlogPdf: boolean = false;

  articles: Article[] = [
    // Dog Articles
    {
      id: 'chien-1',
      title: 'Les bases de l\'alimentation canine',
      category: 'Comment Nourrir Votre Chien',
      animal: 'chien',
      content: `
        <h2>Introduction</h2>
        <p>L'alimentation de votre chien est un pilier fondamental de sa santé et de son bien-être. Une nutrition adaptée permet non seulement de maintenir un poids optimal, mais aussi de prévenir de nombreuses maladies et d'assurer une longévité maximale à votre compagnon.</p>
        
        <h2>Les besoins nutritionnels du chien</h2>
        <p>Le chien est un carnivore opportuniste dont les besoins nutritionnels sont spécifiques. Ses ancêtres sauvages se nourrissaient principalement de proies, ce qui explique son besoin élevé en protéines animales de qualité. Les protéines doivent représenter environ 25 à 30% de son alimentation quotidienne.</p>
        
        <h2>Les différents types d'aliments</h2>
        <p>Il existe plusieurs options pour nourrir votre chien : les croquettes, la pâtée, l'alimentation ménagère ou le régime BARF. Chaque option présente des avantages et des inconvénients. Les croquettes premium offrent un équilibre nutritionnel optimal et une praticité d'utilisation, tandis que l'alimentation ménagère nécessite une préparation minutieuse pour éviter les carences.</p>
        
        <h2>La fréquence des repas</h2>
        <p>Un chien adulte doit généralement être nourri deux fois par jour, matin et soir. Cette répartition permet une meilleure digestion et évite les fringales. Pour les chiots, trois à quatre repas quotidiens sont recommandés jusqu'à l'âge de six mois.</p>
        
        <h2>L'importance de l'hydratation</h2>
        <p>L'eau fraîche et propre doit être disponible en permanence. Un chien doit boire environ 50 à 70 ml d'eau par kilogramme de poids corporel par jour. Une déshydratation peut rapidement devenir dangereuse.</p>
        
        <h2>Conclusion</h2>
        <p>Une alimentation équilibrée et adaptée aux besoins spécifiques de votre chien est essentielle pour sa santé. N'hésitez pas à consulter votre vétérinaire pour établir un plan nutritionnel personnalisé.</p>
      `
    },
    {
      id: 'chien-2',
      title: 'Adapter l\'alimentation selon l\'âge',
      category: 'Comment Nourrir Votre Chien',
      animal: 'chien',
      content: `
        <h2>Introduction</h2>
        <p>Les besoins nutritionnels d'un chien évoluent considérablement tout au long de sa vie. De la croissance rapide du chiot à la sénescence du chien âgé, chaque étape nécessite une adaptation alimentaire spécifique.</p>
        
        <h2>L'alimentation du chiot</h2>
        <p>Durant les premiers mois de vie, le chiot connaît une croissance exponentielle. Ses besoins énergétiques sont deux à trois fois supérieurs à ceux d'un adulte. Les croquettes pour chiots sont enrichies en protéines, calcium et phosphore pour soutenir le développement osseux et musculaire.</p>
        
        <h2>Le chien adulte</h2>
        <p>À partir de 12 mois pour les petites races et 18-24 mois pour les grandes races, le chien atteint sa maturité. L'alimentation doit alors être ajustée pour maintenir un poids optimal et prévenir l'obésité. Les besoins varient selon le niveau d'activité physique.</p>
        
        <h2>Le chien senior</h2>
        <p>Vers 7-8 ans, le métabolisme ralentit et les besoins énergétiques diminuent. Les aliments pour seniors sont moins caloriques mais enrichis en antioxydants, en acides gras oméga-3 et en nutriments protecteurs des articulations comme la glucosamine.</p>
        
        <h2>Les transitions alimentaires</h2>
        <p>Tout changement d'alimentation doit être progressif, sur une période de 7 à 10 jours, en mélangeant progressivement le nouvel aliment à l'ancien. Cette transition graduelle évite les troubles digestifs.</p>
        
        <h2>Conclusion</h2>
        <p>Adapter l'alimentation de votre chien à son âge est crucial pour sa santé à long terme. Consultez régulièrement votre vétérinaire pour ajuster son régime alimentaire.</p>
      `
    },
    {
      id: 'chien-3',
      title: 'Gérer les allergies alimentaires',
      category: 'Comment Nourrir Votre Chien',
      animal: 'chien',
      content: `
        <h2>Introduction</h2>
        <p>Les allergies alimentaires chez le chien sont de plus en plus fréquentes. Elles se manifestent par des symptômes cutanés, digestifs ou comportementaux qui peuvent considérablement affecter la qualité de vie de l'animal.</p>
        
        <h2>Reconnaître les symptômes</h2>
        <p>Les signes d'allergie alimentaire incluent des démangeaisons persistantes, des rougeurs cutanées, des otites récurrentes, des troubles digestifs (diarrhée, vomissements) et parfois des modifications comportementales. Ces symptômes apparaissent généralement après plusieurs semaines d'exposition à l'allergène.</p>
        
        <h2>Les allergènes les plus courants</h2>
        <p>Les protéines animales sont les principaux allergènes : bœuf, poulet, produits laitiers et œufs. Les céréales comme le blé et le maïs peuvent également être en cause. Contrairement aux idées reçues, les allergies aux céréales sont moins fréquentes que celles aux protéines animales.</p>
        
        <h2>Le régime d'éviction</h2>
        <p>Le diagnostic repose sur un régime d'éviction strict de 8 à 12 semaines. On utilise une source de protéines et de glucides que le chien n'a jamais consommée auparavant. Aucune friandise ou complément ne doit être donné pendant cette période.</p>
        
        <h2>Les solutions alimentaires</h2>
        <p>Les aliments hypoallergéniques utilisent des protéines hydrolysées (fragmentées) ou des sources de protéines rares (canard, saumon, sanglier). Ces formulations réduisent considérablement le risque de réaction allergique.</p>
        
        <h2>Conclusion</h2>
        <p>La gestion des allergies alimentaires nécessite patience et rigueur. Un suivi vétérinaire régulier est indispensable pour identifier l'allergène et adapter l'alimentation de manière durable.</p>
      `
    },
    // Cat Articles
    {
      id: 'chat-1',
      title: 'Les besoins spécifiques du chat',
      category: 'Comment Nourrir Votre Chat',
      animal: 'chat',
      content: `
        <h2>Introduction</h2>
        <p>Le chat est un carnivore strict dont les besoins nutritionnels diffèrent fondamentalement de ceux du chien. Comprendre ces spécificités est essentiel pour assurer une alimentation optimale à votre félin.</p>
        
        <h2>Le chat, un carnivore obligatoire</h2>
        <p>Contrairement au chien, le chat ne peut pas synthétiser certains nutriments essentiels comme la taurine, l'arginine et la vitamine A. Ces éléments doivent impérativement être apportés par l'alimentation, principalement d'origine animale. Une carence en taurine peut entraîner de graves problèmes cardiaques et oculaires.</p>
        
        <h2>Les protéines, base de l'alimentation féline</h2>
        <p>Les protéines doivent représenter au minimum 30 à 35% de l'alimentation du chat adulte, et jusqu'à 40% pour un chaton. Ces protéines doivent être de haute qualité et d'origine animale pour assurer une digestibilité optimale et un apport complet en acides aminés essentiels.</p>
        
        <h2>La gestion de l'hydratation</h2>
        <p>Les chats ont naturellement une faible sensation de soif, héritage de leurs ancêtres désertiques. Ils sont donc prédisposés aux problèmes urinaires. L'alimentation humide (pâtée) contribue significativement à l'hydratation et à la prévention des calculs urinaires.</p>
        
        <h2>Les glucides : à limiter</h2>
        <p>Le métabolisme félin est peu adapté à la digestion des glucides. Un excès de glucides peut favoriser l'obésité et le diabète. Les croquettes de qualité limitent les céréales et privilégient les protéines animales.</p>
        
        <h2>Conclusion</h2>
        <p>Respecter les besoins spécifiques du chat en tant que carnivore strict est la clé d'une alimentation saine. Privilégiez toujours des aliments riches en protéines animales de qualité.</p>
      `
    },
    {
      id: 'chat-2',
      title: 'Prévenir l\'obésité féline',
      category: 'Comment Nourrir Votre Chat',
      animal: 'chat',
      content: `
        <h2>Introduction</h2>
        <p>L'obésité touche près de 40% des chats domestiques et constitue un problème de santé majeur. Elle réduit l'espérance de vie et favorise l'apparition de nombreuses pathologies comme le diabète, l'arthrose et les maladies cardiaques.</p>
        
        <h2>Les causes de l'obésité</h2>
        <p>La stérilisation multiplie par deux le risque d'obésité en réduisant les besoins énergétiques de 20 à 30%. La sédentarité, l'alimentation à volonté et les friandises excessives sont d'autres facteurs aggravants. Les chats d'intérieur sont particulièrement à risque.</p>
        
        <h2>Évaluer le poids de son chat</h2>
        <p>Un chat de poids normal présente une taille marquée vue de dessus, des côtes palpables sans pression excessive et un ventre légèrement remonté. Un score corporel peut être établi par votre vétérinaire pour objectiver l'état d'embonpoint.</p>
        
        <h2>Les stratégies de prévention</h2>
        <p>Privilégiez les repas fractionnés (2 à 3 fois par jour) plutôt que l'alimentation à volonté. Utilisez des gamelles anti-glouton ou des distributeurs ludiques pour ralentir la prise alimentaire et stimuler l'activité physique. Pesez les rations quotidiennes pour éviter le suralimentation.</p>
        
        <h2>L'alimentation adaptée</h2>
        <p>Les aliments "light" ou pour chats stérilisés sont moins caloriques tout en maintenant un bon niveau de protéines. Ils contiennent plus de fibres pour favoriser la satiété. Évitez les friandises industrielles et préférez des morceaux de viande cuite.</p>
        
        <h2>Conclusion</h2>
        <p>La prévention de l'obésité passe par une alimentation contrôlée et une activité physique régulière. Un suivi vétérinaire permet d'ajuster les rations et de détecter précocement toute prise de poids.</p>
      `
    },
    {
      id: 'chat-3',
      title: 'La santé urinaire du chat',
      category: 'Comment Nourrir Votre Chat',
      animal: 'chat',
      content: `
        <h2>Introduction</h2>
        <p>Les troubles urinaires représentent l'un des motifs de consultation vétérinaire les plus fréquents chez le chat. Une alimentation adaptée joue un rôle préventif majeur dans la santé du système urinaire félin.</p>
        
        <h2>Les pathologies urinaires courantes</h2>
        <p>Les calculs urinaires (struvites et oxalates de calcium) et la cystite idiopathique sont les affections les plus fréquentes. Elles se manifestent par des difficultés à uriner, du sang dans les urines, des mictions fréquentes et parfois une malpropreté soudaine.</p>
        
        <h2>Le rôle crucial de l'hydratation</h2>
        <p>Une urine diluée prévient la formation de cristaux. Encouragez votre chat à boire en multipliant les points d'eau, en utilisant des fontaines à eau et en proposant de l'alimentation humide. L'objectif est d'obtenir des urines claires et abondantes.</p>
        
        <h2>L'importance du pH urinaire</h2>
        <p>Le pH urinaire influence la formation des cristaux. Un pH trop alcalin favorise les struvites, tandis qu'un pH trop acide favorise les oxalates. Les aliments urinaires maintiennent un pH optimal entre 6,0 et 6,5.</p>
        
        <h2>Les aliments thérapeutiques</h2>
        <p>Les croquettes urinaires contiennent des minéraux contrôlés (magnésium, calcium, phosphore) et favorisent la dilution urinaire. Elles peuvent dissoudre certains types de calculs et prévenir leur récidive. Leur utilisation doit être supervisée par un vétérinaire.</p>
        
        <h2>Conclusion</h2>
        <p>La prévention des troubles urinaires repose sur une hydratation optimale et une alimentation adaptée. En cas de symptômes, consultez rapidement votre vétérinaire car certaines obstructions urinaires constituent des urgences vitales.</p>
      `
    }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private http: HttpClient,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    console.log('ConseilArticlesComponent initialized');
    
    this.route.params.subscribe(params => {
      const articleId = params['id'];
      console.log('Article ID from route:', articleId);
      
      // Check if this is a blog PDF navigation
      if (articleId === 'blog-pdf') {
        const navigation = this.router.getCurrentNavigation();
        const state = navigation?.extras?.state || (history.state as any);
        
        console.log('Navigation state:', state);
        
        if (state && state.blogPost) {
          console.log('Blog post data found:', state.blogPost);
          this.isBlogPdf = true;
          this.blogPdfData = state.blogPost;
          this.loadBlogPdf();
        } else {
          console.error('No blog post data in navigation state');
          // No blog data, redirect back
          this.router.navigate(['/espace-proprietaire']);
        }
      } else {
        // Regular static article
        this.isBlogPdf = false;
        this.article = this.articles.find(a => a.id === articleId) || null;
        
        if (!this.article) {
          this.router.navigate(['/espace-proprietaire']);
        }
      }
    });
  }

  loadBlogPdf(): void {
    if (!this.blogPdfData || !this.blogPdfData.pdfUrl) {
      console.error('No PDF URL available');
      return;
    }

    console.log('Loading blog PDF:', this.blogPdfData.pdfUrl);
    this.isPdfLoading = true;

    // Fetch PDF as blob with credentials
    this.http.get(this.blogPdfData.pdfUrl, {
      responseType: 'blob',
      withCredentials: true
    }).subscribe({
      next: (blob: Blob) => {
        console.log('✓ PDF blob received!');
        console.log('Blob size:', blob.size, 'bytes');

        // Revoke old blob URL if exists
        if (this.pdfBlobUrl) {
          URL.revokeObjectURL(this.pdfBlobUrl);
        }

        // Create blob with correct PDF type
        const pdfBlob = new Blob([blob], { type: 'application/pdf' });
        this.pdfBlobUrl = URL.createObjectURL(pdfBlob);
        // Add parameters to hide PDF viewer toolbar and controls
        this.safePdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.pdfBlobUrl + '#toolbar=0&navpanes=0&scrollbar=0');

        console.log('✓ Blob URL created:', this.pdfBlobUrl);

        // Render PDF using PDF.js
        this.renderPdfWithPdfJs(this.pdfBlobUrl);
      },
      error: (error) => {
        console.error('✗ Error fetching PDF:', error);
        this.isPdfLoading = false;
        
        // Fallback: try direct URL
        if (error.status === 200 || error.status === 0) {
          console.log('Trying fallback: direct URL');
          this.safePdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.blogPdfData!.pdfUrl + '#toolbar=0&navpanes=0&scrollbar=0');
          this.renderPdfWithPdfJs(this.blogPdfData!.pdfUrl);
        } else {
          alert('Erreur lors du chargement du PDF');
        }
      }
    });
  }

  renderPdfWithPdfJs(pdfUrl: string): void {
    // Wait for DOM to be ready
    setTimeout(() => {
      // Check if PDF.js is loaded
      if (typeof (window as any).pdfjsLib === 'undefined') {
        console.error('PDF.js not loaded, falling back to iframe');
        this.isPdfLoading = false;
        // Fallback: show error message
        const container = document.getElementById('pdf-container');
        if (container) {
          container.innerHTML = `
            <div class="text-center py-8">
              <p class="text-gray-600 mb-4">Impossible de charger le visualiseur PDF.</p>
              <a href="${pdfUrl}" target="_blank" class="px-6 py-2.5 rounded-full font-semibold text-white bg-pink-500 hover:bg-pink-600 inline-block">
                Ouvrir le PDF dans un nouvel onglet
              </a>
            </div>
          `;
        }
        return;
      }

      const pdfjsLib = (window as any).pdfjsLib;
      
      // Set worker source
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

      console.log('Loading PDF with PDF.js:', pdfUrl);

      // Load the PDF document
      const loadingTask = pdfjsLib.getDocument(pdfUrl);
      
      loadingTask.promise.then((pdf: any) => {
        console.log('PDF loaded successfully, pages:', pdf.numPages);
        
        const container = document.getElementById('pdf-container');
        if (!container) {
          console.error('PDF container not found in DOM');
          this.isPdfLoading = false;
          return;
        }

        // Clear container
        container.innerHTML = '';

        // Render all pages
        const renderPromises = [];
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          renderPromises.push(this.renderPage(pdf, pageNum, container));
        }

        Promise.all(renderPromises).then(() => {
          this.isPdfLoading = false;
          console.log('✓ All PDF pages rendered successfully');
        }).catch((error: any) => {
          console.error('Error rendering pages:', error);
          this.isPdfLoading = false;
        });
      }).catch((error: any) => {
        console.error('Error loading PDF document:', error);
        this.isPdfLoading = false;
        
        // Show error message
        const container = document.getElementById('pdf-container');
        if (container) {
          container.innerHTML = `
            <div class="text-center py-8">
              <p class="text-red-600 mb-4">Erreur lors du chargement du PDF: ${error.message || 'Erreur inconnue'}</p>
              <a href="${pdfUrl}" target="_blank" class="px-6 py-2.5 rounded-full font-semibold text-white bg-pink-500 hover:bg-pink-600 inline-block">
                Ouvrir le PDF dans un nouvel onglet
              </a>
            </div>
          `;
        }
      });
    }, 100); // Small delay to ensure DOM is ready
  }

  renderPage(pdf: any, pageNum: number, container: HTMLElement): Promise<void> {
    return pdf.getPage(pageNum).then((page: any) => {
      const scale = 1.5;
      const viewport = page.getViewport({ scale: scale });

      // Create canvas for this page
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      canvas.style.display = 'block';
      canvas.style.margin = '0 auto 20px auto';
      canvas.style.maxWidth = '100%';
      canvas.style.height = 'auto';

      container.appendChild(canvas);

      // Render PDF page into canvas context
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      return page.render(renderContext).promise;
    });
  }

  goBack(): void {
    // Clean up blob URL if exists
    if (this.pdfBlobUrl) {
      URL.revokeObjectURL(this.pdfBlobUrl);
      this.pdfBlobUrl = null;
    }
    this.location.back();
  }

  ngOnDestroy(): void {
    // Clean up blob URL on component destroy
    if (this.pdfBlobUrl) {
      URL.revokeObjectURL(this.pdfBlobUrl);
    }
  }
}
