import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ErrorSanitizerService } from '../../services/error-sanitizer.service';

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
      title: 'Nourriture pour chatons : répondre à leurs besoins nutritionnels',
      category: 'Comment Nourrir Votre Chat',
      animal: 'chat',
      content: `
    <h2>Introduction</h2>
    <p>Votre petit chaton va connaître une période de croissance incroyable au cours de sa première année de vie. À titre d'exemple, nous, les humains, atteindrons en 18 ans environ 20 fois notre poids de naissance. Votre chaton, quant à lui, atteindra un poids 50 fois supérieur à son poids de naissance en seulement 12 mois ! Votre chaton a besoin de nutriments très spécifiques pour accomplir cet exploit, mais n'importe quel aliment ne peut pas les lui fournir.</p>

    <h2>Comprendre la croissance du chaton</h2>
    <p>Au cours des deux ou trois premiers mois de sa vie, le poids d'un chaton nouveau-né est multiplié par dix. La plupart des chats atteignent leur taille maximale à l'âge d'un an, mais les chats de grande race peuvent continuer à grandir jusqu'à l'âge de 15 à 18 mois.</p>
    <p>Il n'est pas question de nourrir un chaton avec un aliment standard pour chat adulte : il a besoin d'une nourriture très riche et spécifique pour prendre le meilleur départ possible dans la vie et l'aider à se développer harmonieusement. Votre chaton est encore fragile, il a besoin d'être soutenu pour faire face à 3 impératifs : grandir harmonieusement, s'habituer à digérer autre chose que le lait maternel et obtenir un système immunitaire compétent.</p>
    <p>Contrôler régulièrement le poids de votre chaton est un excellent moyen de s'assurer qu'il grandit comme il se doit. L'obésité est malheureusement fréquente chez les chats et peut entraîner un certain nombre de problèmes de santé, tels que des maladies articulaires.</p>
    <p>Pour suivre la croissance de votre chaton, pesez-le toutes les deux semaines et reportez son poids sur une courbe de croissance. Il s'agit d'un tableau qui vous permet de comparer la croissance de votre chaton dans le temps à la croissance attendue d'un chaton en bonne santé de la même race, du même âge et du même sexe. Votre vétérinaire peut vous fournir une courbe de croissance appropriée, vous aider à interpréter la croissance de votre chaton et vous donner des conseils si votre chaton ne grandit pas comme prévu.</p>

    <h2>Pourquoi une alimentation de qualité est-elle si importante pour votre chaton ?</h2>
    <p>Pendant cette période de croissance intense, le chaton a des besoins nutritionnels très spécifiques. Les meilleures croquettes pour chaton pour répondre à ces besoins sont celles qui sont complètes et équilibrées.</p>
    <p>Un aliment complet contient tous les nutriments essentiels dont un chaton a besoin pour une croissance et un développement sains :</p>
    <ul>
      <li>Des protéines animales de haute qualité pour la croissance musculaire et osseuse, la fonction articulaire, la santé de la peau et du pelage, la santé urinaire et la santé immunitaire.</li>
      <li>L'ajout de prébiotiques, probiotiques et d'argiles aidera également à limiter les troubles digestifs, fréquents chez le jeune animal, et permettra ainsi une utilisation optimale des protéines.</li>
      <li>Des acides gras essentiels pour soutenir la vision et le système nerveux.</li>
      <li>Des vitamines et minéraux, tels que le calcium et le phosphore, pour un développement osseux sain.</li>
      <li>Une nourriture riche en matières grasses pour fournir de l'énergie sous forme concentrée, adaptée aux capacités d'ingestion limitées du chaton.</li>
      <li>Un aliment enrichi en béta glucanes (extraits de levures de bière) aide à l'acquisition des défenses naturelles propres du chaton au moment où la protection immunitaire apportée par sa mère disparaît progressivement.</li>
    </ul>
    <p>« Équilibré » signifie que tous les nutriments nécessaires sont présents dans les bonnes quantités et les bons rapports pour les chatons en pleine croissance. Les aliments contenant trop ou pas assez de certains nutriments peuvent causer de graves problèmes de santé à votre chaton. Par exemple :</p>
    <ul>
      <li>Une carence en vitamine A peut altérer la vision et la coordination musculaire.</li>
      <li>Une carence en protéines peut freiner la croissance et provoquer une mue (perte de poils) chronique.</li>
      <li>L'excès de glucides peut surcharger le système digestif de votre chaton, entraîner une prise de poids excessive et contribuer au diabète.</li>
    </ul>

    <h2>Choisir les meilleures croquettes pour chatons pour une santé optimale</h2>
    <p>Les besoins nutritionnels de votre chaton évolueront au fur et à mesure de sa croissance, et il doit en être de même pour son alimentation.</p>
    <p>Lorsque vous choisissez les meilleures croquettes pour chatons, recherchez des aliments complets et équilibrés contenant des ingrédients de la plus haute qualité. La formule idéale contient :</p>
    <ul>
      <li>Beaucoup de protéines animales hautement digestibles pour favoriser la croissance.</li>
      <li>Des bêta-glucanes pour renforcer le système immunitaire immature de votre chaton.</li>
      <li>Des quantités élevées de DHA pour soutenir la vision et le système nerveux.</li>
    </ul>

    <h2>Comment sevrer votre chaton avec des croquettes ?</h2>
    <p>Lorsque vous adoptez un chaton, il doit déjà avoir été sevré du lait de sa mère et avoir reçu une alimentation pour chaton. Il est conseillé de garder votre chaton avec le même aliment jusqu'à ce qu'il se soit installé dans son nouveau foyer, car un changement de régime alimentaire pourrait ajouter au stress lié au départ de la portée.</p>
    <p>Lorsque votre chaton est prêt, vous pouvez lui donner des croquettes pour chatons, de manière progressive. Pour commencer, mélangez sa nourriture actuelle avec une petite quantité de nouvelles croquettes. Commencez par un mélange à 75/25 % pendant les premiers jours, en surveillant votre chaton en cas de troubles digestifs. Ensuite, augmentez progressivement la quantité de croquettes et réduisez la quantité de l'ancienne nourriture jusqu'à ce que la transition soit complète.</p>
    <p>Veillez également à ce que votre chaton dispose de beaucoup d'eau fraîche. Placez ses gamelles d'eau et de nourriture loin de la litière, dans un endroit propre et calme où il ne sera pas dérangé.</p>
    <p>Après avoir été sevré du lait de sa mère, votre chaton ne sera plus capable de digérer le lactose (un sucre présent dans le lait), mais il ne pourra pas encore digérer correctement les féculents comme un chat adulte. Les meilleures croquettes pour chatons en tiennent compte : elles ont une faible teneur en glucides et contiennent des prébiotiques et des probiotiques pour nourrir le système digestif délicat du chaton.</p>

    <h2>Quelle quantité de nourriture devez-vous donner à votre chaton ?</h2>
    <p>Les besoins énergétiques et alimentaires quotidiens de votre chaton varient en fonction de son âge, de son sexe et de sa race. Utilisez les recommandations du fabricant figurant sur l'emballage ou demandez conseil à votre vétérinaire.</p>
    <p>La plupart des chatons s'accommodent bien de l'alimentation libre, qui consiste à distribuer en une seule fois la totalité de la ration quotidienne et à laisser le chaton manger à sa guise tout au long de la journée. Cependant, certains chatons peuvent se suralimenter s'ils sont laissés en liberté, ce qui peut entraîner une prise de poids excessive. Ces chatons peuvent bénéficier de repas plus petits tout au long de la journée, avec un horaire d'alimentation fixe et cohérent.</p>
    <p>Pour vous assurer que votre chaton mange la bonne quantité, surveillez son poids à l'aide de la courbe de croissance. Vous pouvez vous en servir pour ajuster sa ration alimentaire et ses horaires d'alimentation si nécessaire.</p>

    <h2>Autres régimes pour les chatons</h2>
    <p>Les aliments faits maison, le végétarisme et les régimes à base de viande crue ont gagné en popularité auprès de certains propriétaires d'animaux, mais nous déconseillons ces régimes à votre chaton.</p>
    <p>Les aliments faits maison (sauf s'ils sont recommandés par un vétérinaire et suivis correctement) et les régimes à base de viande crue entraînent souvent des carences en nutriments chez les chatons, ce qui les expose à des problèmes de santé tout au long de leur vie. En outre, les chats sont des carnivores de nature, ce qui signifie qu'ils ne peuvent pas obtenir les nutriments dont ils ont besoin pour survivre uniquement à partir d'aliments d'origine végétale. C'est pourquoi les chatons ne doivent jamais être nourris avec des régimes végétariens ou végétaliens.</p>

    <h2>Conclusion</h2>
    <p>L'alimentation que vous donnez à votre chaton aujourd'hui déterminera sa santé pour les années à venir. Pour aider votre chaton à devenir un chat heureux et bien dans ses pattes, veillez à ne lui donner que des aliments complets, équilibrés et recommandés par les vétérinaires, adaptés à son stade de vie. Surveillez la croissance de votre chaton et consultez régulièrement votre vétérinaire ; celui-ci peut vous aider à répondre à toute question ou préoccupation d'ordre nutritionnel, à repérer les problèmes à un stade précoce et à conseiller l'alimentation qui permettra à votre chaton de s'épanouir pleinement.</p>
  `
},
    {
      id: 'chat-2',
      title: 'Quels besoins nutritionnels pour mon chat adulte ?',
      category: 'Comment Nourrir Votre Chat',
      animal: 'chat',
      content: `
        <h2>Introduction</h2>
        <p>Plus de 80 % des chats adultes sont stérilisés. La stérilisation peut prédisposer à l'apparition de deux risques majeurs : l'excès de poids (qui peut lui-même favoriser l'apparition du diabète sucré) et les affections du bas appareil urinaire. Une alimentation adaptée est essentielle pour maintenir votre chat adulte en bonne santé.</p>
        
        <h2>Les besoins nutritionnels du chat adulte</h2>
        <p>Le chat est un carnivore strict dont les besoins en protéines animales sont élevés. Un chat adulte nécessite environ 30 à 40% de protéines dans son alimentation. Les protéines de qualité favorisent le maintien de la masse musculaire et soutiennent le système immunitaire.</p>
        
        <h2>Impact de la stérilisation</h2>
        <p>La stérilisation réduit les besoins énergétiques de 20 à 30% tout en augmentant l'appétit. Sans ajustement alimentaire, le risque d'obésité est multiplié par deux. Les aliments pour chats stérilisés sont moins caloriques et enrichis en fibres pour favoriser la satiété.</p>
        
        <h2>Prévention des troubles urinaires</h2>
        <p>Les chats stérilisés sont plus sujets aux calculs urinaires. Une alimentation adaptée maintient un pH urinaire optimal et favorise la dilution des urines. L'hydratation est cruciale : encouragez votre chat à boire en multipliant les points d'eau et en proposant de l'alimentation humide.</p>
        
        <h2>Fréquence et quantité des repas</h2>
        <p>Un chat adulte doit être nourri 2 à 3 fois par jour avec des rations contrôlées. Évitez l'alimentation à volonté qui favorise la suralimentation. Pesez les rations quotidiennes selon les recommandations du fabricant et ajustez selon l'état corporel de votre chat.</p>
        
        <h2>Conclusion</h2>
        <p>Une alimentation équilibrée, adaptée au statut de stérilisation et au niveau d'activité de votre chat adulte, est la clé d'une vie longue et en bonne santé. Consultez régulièrement votre vétérinaire pour ajuster l'alimentation selon les besoins évolutifs de votre compagnon.</p>
      `
    },
    {
      id: 'chat-3',
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
      id: 'chat-4',
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
    private sanitizer: DomSanitizer,
    private errorSanitizer: ErrorSanitizerService
  ) {}

  ngOnInit(): void {
    
    this.route.params.subscribe(params => {
      const articleId = params['id'];
      
      // Check if this is a blog PDF navigation
      if (articleId === 'blog-pdf') {
        const navigation = this.router.getCurrentNavigation();
        const state = navigation?.extras?.state || (history.state as any);
        
        
        if (state && state.blogPost) {
          this.isBlogPdf = true;
          this.blogPdfData = state.blogPost;
          this.loadBlogPdf();
        } else {
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
      return;
    }

    this.isPdfLoading = true;

    // Fetch PDF as blob with credentials
    this.http.get(this.blogPdfData.pdfUrl, {
      responseType: 'blob',
      withCredentials: true
    }).subscribe({
      next: (blob: Blob) => {
     
        // Revoke old blob URL if exists
        if (this.pdfBlobUrl) {
          URL.revokeObjectURL(this.pdfBlobUrl);
        }

        // Create blob with correct PDF type
        const pdfBlob = new Blob([blob], { type: 'application/pdf' });
        this.pdfBlobUrl = URL.createObjectURL(pdfBlob);
        // Add parameters to hide PDF viewer toolbar and controls
        this.safePdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.pdfBlobUrl + '#toolbar=0&navpanes=0&scrollbar=0');


        // Render PDF using PDF.js
        this.renderPdfWithPdfJs(this.pdfBlobUrl);
      },
      error: (error) => {
        this.isPdfLoading = false;
        
        // Fallback: try direct URL
        if (error.status === 200 || error.status === 0) {
          this.safePdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.blogPdfData!.pdfUrl + '#toolbar=0&navpanes=0&scrollbar=0');
          this.renderPdfWithPdfJs(this.blogPdfData!.pdfUrl);
        } else {
          alert('Erreur lors du chargement du PDF');
        }
      }
    });
  }

  renderPdfWithPdfJs(pdfUrl: string): void {
    // Dynamically load PDF.js if not already loaded
    if (typeof (window as any).pdfjsLib === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => {
        this.initializePdfRendering(pdfUrl);
      };
      script.onerror = () => {
        this.showPdfError(pdfUrl, 'Impossible de charger la bibliothèque PDF.');
      };
      document.head.appendChild(script);
    } else {
      this.initializePdfRendering(pdfUrl);
    }
  }

  private initializePdfRendering(pdfUrl: string): void {
    // Wait for DOM to be ready
    setTimeout(() => {
      const pdfjsLib = (window as any).pdfjsLib;
      
      // Set worker source
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';


      // Load the PDF document
      const loadingTask = pdfjsLib.getDocument(pdfUrl);
      
      loadingTask.promise.then((pdf: any) => {
        
        const container = document.getElementById('pdf-container');
        if (!container) {
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
        }).catch((error: any) => {
          this.isPdfLoading = false;
        });
      }).catch((error: any) => {
        this.isPdfLoading = false;
        
        // Show error message
        const container = document.getElementById('pdf-container');
        if (container) {
          container.innerHTML = `
            <div class="text-center py-8">
              <p class="text-red-600 mb-4">Erreur lors du chargement du PDF. Veuillez réessayer.</p>
              <a href="${pdfUrl}" target="_blank" class="px-6 py-2.5 rounded-full font-semibold text-white bg-pink-500 hover:bg-pink-600 inline-block">
                Ouvrir le PDF dans un nouvel onglet
              </a>
            </div>
          `;
        }
      });
    }, 100); // Small delay to ensure DOM is ready
  }

  private showPdfError(pdfUrl: string, message: string): void {
    this.isPdfLoading = false;
    const container = document.getElementById('pdf-container');
    if (container) {
      container.innerHTML = `
        <div class="text-center py-8">
          <p class="text-gray-600 mb-4">${message}</p>
          <a href="${pdfUrl}" target="_blank" class="px-6 py-2.5 rounded-full font-semibold text-white bg-pink-500 hover:bg-pink-600 inline-block">
            Ouvrir le PDF dans un nouvel onglet
          </a>
        </div>
      `;
    }
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
