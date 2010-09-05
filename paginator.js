/*
 * paginator.js
 * Version 2.1.0
 * Cédric de Saint Martin pour trimane.fr
 *
 * Changelog :
 * 1.0.0 : initial release
 * 1.0.1 : debugging optional parameters by Pierre Berteigne
 * 1.0.2 : adding support for textbox as optional parameters
 * 1.1.0 : adding support for optional callback method
 * 1.2.0 : adding support for an optional "launch" button
 * 2.0.0 : rewrite of all the constructor, now VERY simple to use, and ALL dynamic. More jQuery-ish. You can now use two or more Paginators in the same page with 5 lines of code.
 * 2.1.0 : Adding the functionnality to hide "next" and "previous" buttons automatically
 *
 * TODO : delete the horror i've made when changing on-the-fly the value of nombreTotal from the page called via ajax, and replace it by a hidden div containing the value and parse it each time.
 */


/* Note d'utilisation :
 *
 *
 * copiez cet appel de fonction dans votre page, et personnalisez la. Pour plusieurs paginators dans la même page, copiez le deux fois en changeant le nom passé en paramètre.
 * Tous les paramètres sont optionnels. C'est à dire que si un paramètre ne vous interesse pas, ou que vous ne le comprenez pas, virez le!

// Définissez les différents id et paramétres ci-dessous
Paginator.initPaginator("leNomDeMonPaginatorPerso", {
		// Les différents paramétres que vous voulez passer à la jsp lors du chargement AJAX, associés aux éléments qui les contiennent
		// Pour isoler les éléments utilisés par le Paginator, on doit rajouter un class="paginator onchange" en plus de l'id dans l'élément considéré dans la page principale. cf le select "filtre" de tic_tickets.jsp pour un exemple
		parametres: [
			'idDuSelectDeMonChoix1',
			'idDuSelectDeMonChoix2'
		],
		// Si vous ne changez pas la structure de la page, les options ci-dessous sont... optionnelles. Si vous n'y comprenez pas grand chose, reprenez le code de tic_tickets.jsp.
		// L'id du div contenant la table à afficher
		idDivContainer: 'listeAjax',
		// Les ids des boutons "précédent" et "suivant"
		idPrecedent: 'precedent',
		idSuivant: 'suivant',
		// L'id du select "nombre d'élément souhaité par page"
		idNombreChoisi: 'nombreChoisi',
		// Le nom de la JSP appelée via AJAX
		jspListe: '../../actionBean/tic/Tic_ListeTickets.action',
		// La fonction qui sera executée juste après un appel ajax (optionnel)
		optionalCallback: function() {
			// Votre code à appeler en cas de succès ici.
		},
		// Si vous ne voulez pas d'une mise à jour automatique, et que vous voulez attendre que tous les champs soient remplis avant que le paginator ne se mette à jour (exemple : recherche avancée) : rajoutez un bouton "lancer le paginator"
		// Ici, mettez alors l'id de ce bouton. Sinon, laissez le à null.
		optionalLaunchButton: null
});
*/

Paginator = {
	// Veuillez cliquer sur le "+" ci-dessus si vous êtes dans Eclipse pour voir le "readme"
	Methods: {
		innerOptions: {
			nombreTotal: 0, // This is set by every ajax response
			affiche: 1
		},
		init: function() {
			var that = this;
			// Assigns every event handler
			this.getElementBySelector(this.idPrecedent).click(function(event) {
				event.preventDefault();
				that.loadListeTickets('precedent');
			});
			this.getElementBySelector(this.idSuivant).click(function(event) {
				event.preventDefault();
				that.loadListeTickets('suivant');
			});
			if (typeof this.optionalLaunchButton == 'string') { // If they defined an optional launch button in their options
				if (this.optionalLaunchButton) {
					$('#' + this.optionalLaunchButton).click(function(event) {
						event.preventDefault();
						that.loadListeTickets();
					});
				}
			} else {
				$('.paginator.onchange').click(function(event) {
					event.preventDefault();
					that.loadListeTickets('reset');
				});
				$('.paginator.onchange').keyup(function(event) {
					event.preventDefault();
					that.loadListeTickets('reset');
				});
				this.loadAjax(1, 10);
			}
		},
		loadListeTickets: function(sens) {
			// Récupération du nombre de tickets à afficher sélectionné
			var nombre = parseInt(this.getElementBySelector(this.idNombreChoisi).val());
			// Récupération du numéro du 1er ticket à afficher
			var debut = this.affiche;
			// Traitements selon les cas
			if (sens == 'suivant') {
				if (this.affiche + nombre > this.nombreTotal) return null;
				debut = this.affiche + nombre;
				if (debut >= this.nombreTotal) debut = this.nombreTotal;
			}
			else if (sens == 'precedent') {
				if (this.affiche == 1) return null;
				debut = this.affiche - nombre;
				if (debut <= 0) debut = 1;
			} else if (sens == 'reset') {
				debut = 1;
			}
			if (this.affiche + nombre > this.nombreTotal) {
				debut = (this.nombreTotal - nombre < 1) ? 1 : this.nombreTotal - nombre;
			}
			// Appel de la JSP de listing avec les bons paramétres, remplacement du contenu du div
			this.loadAjax(debut, nombre);
		},
		loadAjax: function(debut, nombre) {
			var that = this;
			var url = this.jspListe + '?debut=' + debut + '&nombre=' + nombre;
			for (param in this.parametres) {
				url += '&' + this.parametres[param] + '=' + this.getElementBySelector(this.parametres[param]).val();
			}
			this.getElementBySelector(this.idDivContainer).load(url, function(response, status, xhr) {
				// Erreur :
				if (status == 'erreur') {
					var msg = 'Une erreur est survenue : ';
					alert(msg + xhr.status + ' ' + xhr.statusText);
				}
				// Succès :
				else {
					that.affiche = debut;
					selecteur = new Selecteur();
					try { that.optionalCallback(); } catch (e) {}
					// Gestion de l'affichage des boutons
					if (that.nombreTotal < nombre) {
						that.getElementBySelector(that.idPrecedent).hide();
						that.getElementBySelector(that.idSuivant).hide();
					} else if (that.affiche == 1) {
						that.getElementBySelector(that.idPrecedent).hide();
						that.getElementBySelector(that.idSuivant).show();
					} else if (that.affiche + parseInt(that.getElementBySelector(that.idNombreChoisi).val()) > that.nombreTotal) {
						that.getElementBySelector(that.idPrecedent).show();
						that.getElementBySelector(that.idSuivant).hide();
					} else {
						that.getElementBySelector(that.idPrecedent).show();
						that.getElementBySelector(that.idSuivant).show();
					}
				}
				// Dans tous les cas :
				$('.fancybox').fancybox({
					'titlePosition'	: 'outside',
					'transitionIn'	: 'elastic',
					'transitionOut'	: 'elastic'
				});

			});
		},
		getElementBySelector: function(id) {
			return $('#' + id + '.paginator');
		},
		initPaginator: function(instanceName, params) {
			window[instanceName] = {};
			instance = window[instanceName];
			$.extend(true, instance, Paginator, params);
			instance.init();
		}
	},
	Defaults: {
		parametres: [],
		idDivContainer: 'listeAjax',
		idPrecedent: 'precedent',
		idSuivant: 'suivant',
		idNombreChoisi: 'nombreChoisi',
		jspListe: '../../actionBean/tic/Tic_ListeTickets.action',
		optionalCallback: function() {
		},
		optionalLaunchButton: null
	}
};

$.extend(Paginator, Paginator.Methods, Paginator.Methods.innerOptions, Paginator.Defaults);




// Un sélecteur, dans le cas ou nous avons de multiples checkboxes, fait pour fonctionner avec le paginator
Selecteur = function() {
	// Constructeur
	selecteur = this;
	this.n = 0;
	$('#checkall').click(function() {
		if ($(this)[0].checked) {
			$('.tocheck').each(function() {
				if (!$(this)[0].checked) {
					selecteur.n++;
				}
			});
		} else {
			selecteur.n = 0;
		}
		var checked_status = this.checked;
		$('input.tocheck').each(function() {
			this.checked = checked_status;
		});
		selecteur.toggleButtons();
	});
	$('.tocheck').each(function() {
		$(this).click(function() {
			if ($(this)[0].checked) {
				selecteur.n++;
			} else {
				selecteur.n--;
			}
			if (selecteur.n == 0) {
				$('#checkall')[0].checked = false;
			}
			selecteur.toggleButtons();
		});
	});
	// Méthodes
	this.toggleButtons = function() {
		if (this.n == 0) {
			$('.unique').addClass('grise');
			$('.multiple').addClass('grise');
		}
		if (this.n == 1) {
			$('.unique').removeClass('grise');
			$('.multiple').removeClass('grise');
		}
		if (this.n > 1) {
			$('.unique').addClass('grise');
			$('.multiple').removeClass('grise');
		}
	};
};











































//Hack moche
SelecteurForum = function(form) {
	// Constructeur
	selecteur = this;
	this.n = 0;
	form.$('#checkall').click(function() {
		if ($(this)[0].checked) {
			$('.tocheck').each(function() {
				if (!$(this)[0].checked) {
					selecteur.n++;
				}
			});
		} else {
			selecteur.n = 0;
		}
		var checked_status = this.checked;
		$('input.tocheck').each(function() {
			this.checked = checked_status;
		});
		selecteur.toggleButtons();
	});
	form.$('.tocheck').each(function() {
		$(this).click(function() {
			alert($(this)[0].checked);
			if ($(this)[0].checked) {
				selecteur.n++;
			} else {
				selecteur.n--;
			}
			if (selecteur.n == 0) {
				$('#checkall')[0].checked = false;
			}
			selecteur.toggleButtons();
		});
	});
	// Méthodes
	this.toggleButtons = function() {
		if (this.n == 0) {
			$('.unique').addClass('grise');
			$('.multiple').addClass('grise');
		}
		if (this.n == 1) {
			$('.unique').removeClass('grise');
			$('.multiple').removeClass('grise');
		}
		if (this.n > 1) {
			$('.unique').addClass('grise');
			$('.multiple').removeClass('grise');
		}
	};
};
