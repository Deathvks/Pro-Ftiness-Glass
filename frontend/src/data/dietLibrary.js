/* frontend/src/data/dietLibrary.js */

export const TEMPLATE_DIETS = [
    // ============================================================
    // OBJETIVO: PÉRDIDA DE GRASA (DEFINICIÓN)
    // ============================================================
    {
        id: 'fat-loss-1',
        name: 'Definición Agresiva (1800 kcal)',
        description: 'Alta en proteínas y vegetales para mantener saciedad con déficit calórico.',
        goal: 'lose',
        total_calories: 1800,
        total_protein: 160,
        total_carbs: 120,
        total_fats: 60,
        meals: [
            {
                id: 'fl1-m1',
                name: 'Desayuno Proteico',
                description: 'Tortitas de avena y claras',
                foods: [
                    { quantity: '200g', name: 'Claras de huevo líquidas' },
                    { quantity: '40g', name: 'Avena molida (harina de avena)' },
                    { quantity: '80g', name: 'Plátano (1 unidad pequeña)' },
                    { quantity: '2g', name: 'Canela en polvo' }
                ],
                calories: 350,
                protein_g: 30,
                carbs_g: 45,
                fats_g: 3,
            },
            {
                id: 'fl1-m2',
                name: 'Almuerzo Ligero',
                description: 'Pollo a la plancha con ensalada verde',
                foods: [
                    { quantity: '150g', name: 'Pechuga de pollo (cruda)' },
                    { quantity: '200g', name: 'Mezcla de lechugas/brotes' },
                    { quantity: '100g', name: 'Tomate cherry' },
                    { quantity: '10g', name: 'Aceite de oliva virgen extra (1 cda)' }
                ],
                calories: 450,
                protein_g: 35,
                carbs_g: 10,
                fats_g: 15,
            },
            {
                id: 'fl1-m3',
                name: 'Merienda / Pre-entreno',
                description: 'Yogur Griego y Frutos Rojos',
                foods: [
                    { quantity: '125g', name: 'Yogur Griego Ligero/Desnatado' },
                    { quantity: '100g', name: 'Fresas o Arándanos' },
                    { quantity: '20g', name: 'Nueces al natural' }
                ],
                calories: 250,
                protein_g: 15,
                carbs_g: 15,
                fats_g: 12,
            },
            {
                id: 'fl1-m4',
                name: 'Cena Saciente',
                description: 'Pescado blanco y verduras al vapor',
                foods: [
                    { quantity: '200g', name: 'Merluza o Bacalao (limpio)' },
                    { quantity: '200g', name: 'Brócoli al vapor' },
                    { quantity: '150g', name: 'Patata cocida (peso en cocido)' }
                ],
                calories: 500,
                protein_g: 40,
                carbs_g: 30,
                fats_g: 10,
            }
        ]
    },
    {
        id: 'fat-loss-2',
        name: 'Ayuno Intermitente / Low Carb (2000 kcal)',
        description: 'Enfoque bajo en carbohidratos, ideal para días de descanso.',
        goal: 'lose',
        total_calories: 2000,
        total_protein: 170,
        total_carbs: 80,
        total_fats: 100,
        meals: [
            {
                id: 'fl2-m1',
                name: 'Almuerzo (Romper Ayuno)',
                description: 'Revuelto de huevos, aguacate y pavo',
                foods: [
                    { quantity: '180g', name: 'Huevos enteros (3 unidades L)' },
                    { quantity: '100g', name: 'Fiambre de pavo (alto contenido cárnico)' },
                    { quantity: '100g', name: 'Aguacate (media pieza grande)' }
                ],
                calories: 650,
                protein_g: 40,
                carbs_g: 5,
                fats_g: 45,
            },
            {
                id: 'fl2-m2',
                name: 'Snack',
                description: 'Batido de Whey y Almendras',
                foods: [
                    { quantity: '30g', name: 'Proteína de suero (Whey Protein)' },
                    { quantity: '30g', name: 'Almendras naturales (crudas o tostadas)' }
                ],
                calories: 300,
                protein_g: 30,
                carbs_g: 5,
                fats_g: 18,
            },
            {
                id: 'fl2-m3',
                name: 'Cena Rica en Grasas',
                description: 'Salmón al horno con espárragos',
                foods: [
                    { quantity: '200g', name: 'Salmón fresco' },
                    { quantity: '150g', name: 'Espárragos trigueros' },
                    { quantity: '15g', name: 'Aceite de oliva virgen extra' }
                ],
                calories: 800,
                protein_g: 45,
                carbs_g: 5,
                fats_g: 50,
            }
        ]
    },

    // ============================================================
    // OBJETIVO: MANTENIMIENTO (MAINTAIN)
    // ============================================================
    {
        id: 'maintain-1',
        name: 'Mantenimiento Equilibrado (2200 kcal)',
        description: 'Dieta balanceada para mantener peso y rendimiento deportivo moderado.',
        goal: 'maintain',
        total_calories: 2200,
        total_protein: 140,
        total_carbs: 260,
        total_fats: 70,
        meals: [
            {
                id: 'mnt1-m1',
                name: 'Desayuno Clásico',
                description: 'Tostadas con tomate, aceite y pavo',
                foods: [
                    { quantity: '120g', name: 'Pan integral o de hogaza' },
                    { quantity: '100g', name: 'Tomate triturado natural' },
                    { quantity: '15g', name: 'Aceite de oliva virgen extra' },
                    { quantity: '80g', name: 'Fiambre de pavo' },
                    { quantity: '1', name: 'Café o Té sin azúcar' }
                ],
                calories: 550,
                protein_g: 25,
                carbs_g: 60,
                fats_g: 20,
            },
            {
                id: 'mnt1-m2',
                name: 'Almuerzo Mediterráneo',
                description: 'Lentejas guisadas con arroz y verduras',
                foods: [
                    { quantity: '200g', name: 'Lentejas cocidas (de bote o caseras)' },
                    { quantity: '100g', name: 'Arroz blanco cocido' },
                    { quantity: '150g', name: 'Verduras variadas (zanahoria, cebolla, pimiento)' },
                    { quantity: '10g', name: 'Aceite de oliva (para el sofrito)' }
                ],
                calories: 700,
                protein_g: 30,
                carbs_g: 100,
                fats_g: 15,
            },
            {
                id: 'mnt1-m3',
                name: 'Merienda',
                description: 'Yogur con avena y fruta',
                foods: [
                    { quantity: '250g', name: 'Yogur natural (2 unidades)' },
                    { quantity: '40g', name: 'Copos de avena' },
                    { quantity: '150g', name: 'Manzana o Pera' }
                ],
                calories: 400,
                protein_g: 15,
                carbs_g: 60,
                fats_g: 8,
            },
            {
                id: 'mnt1-m4',
                name: 'Cena Ligera',
                description: 'Tortilla francesa con ensalada',
                foods: [
                    { quantity: '120g', name: 'Huevos (2 unidades L)' },
                    { quantity: '150g', name: 'Ensalada mixta (lechuga, tomate, pepino)' },
                    { quantity: '50g', name: 'Atún al natural (media lata)' },
                    { quantity: '10g', name: 'Aceite de oliva' }
                ],
                calories: 550,
                protein_g: 30,
                carbs_g: 10,
                fats_g: 25,
            }
        ]
    },
    {
        id: 'maintain-2',
        name: 'Mantenimiento Activo (2500 kcal)',
        description: 'Para días de entrenamiento o personas con trabajo físico.',
        goal: 'maintain',
        total_calories: 2500,
        total_protein: 160,
        total_carbs: 300,
        total_fats: 80,
        meals: [
            {
                id: 'mnt2-m1',
                name: 'Desayuno Energético',
                description: 'Huevos revueltos, pan y fruta',
                foods: [
                    { quantity: '180g', name: 'Huevos (3 unidades L)' },
                    { quantity: '100g', name: 'Pan integral tostado' },
                    { quantity: '150g', name: 'Naranja (1 pieza mediana)' }
                ],
                calories: 600,
                protein_g: 25,
                carbs_g: 60,
                fats_g: 25,
            },
            {
                id: 'mnt2-m2',
                name: 'Almuerzo',
                description: 'Pasta con carne picada y salsa de tomate',
                foods: [
                    { quantity: '120g', name: 'Pasta (peso en seco)' },
                    { quantity: '120g', name: 'Carne picada de ternera (magra)' },
                    { quantity: '100g', name: 'Salsa de tomate frito' },
                    { quantity: '10g', name: 'Queso rallado' }
                ],
                calories: 850,
                protein_g: 45,
                carbs_g: 90,
                fats_g: 30,
            },
            {
                id: 'mnt2-m3',
                name: 'Merienda Post-Entreno',
                description: 'Bocadillo de lomo embuchado',
                foods: [
                    { quantity: '100g', name: 'Pan de barra' },
                    { quantity: '60g', name: 'Lomo embuchado' },
                    { quantity: '1', name: 'Tomate en rodajas' }
                ],
                calories: 400,
                protein_g: 25,
                carbs_g: 50,
                fats_g: 10,
            },
            {
                id: 'mnt2-m4',
                name: 'Cena Completa',
                description: 'Salmón al horno con patatas',
                foods: [
                    { quantity: '150g', name: 'Salmón fresco' },
                    { quantity: '200g', name: 'Patata asada' },
                    { quantity: '150g', name: 'Judías verdes al vapor' },
                    { quantity: '5g', name: 'Aceite de oliva' }
                ],
                calories: 650,
                protein_g: 35,
                carbs_g: 40,
                fats_g: 35,
            }
        ]
    },

    // ============================================================
    // OBJETIVO: GANANCIA MUSCULAR (VOLUMEN)
    // ============================================================
    {
        id: 'gain-1',
        name: 'Volumen Limpio (3000 kcal)',
        description: 'Superávit calórico controlado. Alta en carbohidratos complejos.',
        goal: 'gain',
        total_calories: 3000,
        total_protein: 200,
        total_carbs: 380,
        total_fats: 70,
        meals: [
            {
                id: 'gn1-m1',
                name: 'Desayuno Power',
                description: 'Gachas de avena (Porridge) completas',
                foods: [
                    { quantity: '100g', name: 'Copos de Avena' },
                    { quantity: '300ml', name: 'Leche semidesnatada' },
                    { quantity: '100g', name: 'Plátano (1 pieza mediana)' },
                    { quantity: '30g', name: 'Whey Protein (sabor vainilla)' },
                    { quantity: '10g', name: 'Crema de cacahuete 100%' }
                ],
                calories: 850,
                protein_g: 45,
                carbs_g: 100,
                fats_g: 18,
            },
            {
                id: 'gn1-m2',
                name: 'Almuerzo Clásico',
                description: 'Arroz, Pollo y Aceite de Oliva',
                foods: [
                    { quantity: '150g', name: 'Arroz blanco (pesado en seco)' },
                    { quantity: '150g', name: 'Pechuga de pollo (plancha)' },
                    { quantity: '10g', name: 'Aceite de oliva virgen extra' }
                ],
                calories: 800,
                protein_g: 40,
                carbs_g: 115,
                fats_g: 15,
            },
            {
                id: 'gn1-m3',
                name: 'Pre-Entreno',
                description: 'Tostadas con mermelada y pavo',
                foods: [
                    { quantity: '100g', name: 'Pan integral o de centeno' },
                    { quantity: '30g', name: 'Mermelada light (sin azúcar añadido)' },
                    { quantity: '100g', name: 'Fiambre de pavo' }
                ],
                calories: 400,
                protein_g: 25,
                carbs_g: 60,
                fats_g: 5,
            },
            {
                id: 'gn1-m4',
                name: 'Cena Recuperadora',
                description: 'Ternera magra con patatas al horno',
                foods: [
                    { quantity: '150g', name: 'Filete de ternera magra' },
                    { quantity: '300g', name: 'Patata asada (al horno o microondas)' },
                    { quantity: '100g', name: 'Ensalada mixta (sin aliño extra)' }
                ],
                calories: 600,
                protein_g: 40,
                carbs_g: 60,
                fats_g: 20,
            }
        ]
    },
    {
        id: 'gain-2',
        name: 'Volumen Alto Rendimiento (3500 kcal)',
        description: 'Para ectomorfos o días de doble sesión. Mucha densidad calórica.',
        goal: 'gain',
        total_calories: 3500,
        total_protein: 220,
        total_carbs: 450,
        total_fats: 90,
        meals: [
            {
                id: 'gn2-m1',
                name: 'Desayuno',
                description: 'Huevos revueltos y tostadas con aguacate',
                foods: [
                    { quantity: '240g', name: 'Huevos L (4 unidades)' },
                    { quantity: '150g', name: 'Pan de hogaza/barra' },
                    { quantity: '100g', name: 'Aguacate' }
                ],
                calories: 900,
                protein_g: 40,
                carbs_g: 80,
                fats_g: 45,
            },
            {
                id: 'gn2-m2',
                name: 'Comida',
                description: 'Pasta Boloñesa (Ternera)',
                foods: [
                    { quantity: '180g', name: 'Pasta (macarrones/espaguetis, peso seco)' },
                    { quantity: '150g', name: 'Carne picada ternera magra (5% grasa)' },
                    { quantity: '100g', name: 'Salsa de tomate frito estilo casero' }
                ],
                calories: 1100,
                protein_g: 60,
                carbs_g: 130,
                fats_g: 25,
            },
            {
                id: 'gn2-m3',
                name: 'Merienda',
                description: 'Batido Casero "Gainer"',
                foods: [
                    { quantity: '400ml', name: 'Leche entera' },
                    { quantity: '100g', name: 'Avena molida' },
                    { quantity: '30g', name: 'Whey Protein' },
                    { quantity: '120g', name: 'Plátano (1 pieza grande)' }
                ],
                calories: 800,
                protein_g: 50,
                carbs_g: 100,
                fats_g: 15,
            },
            {
                id: 'gn2-m4',
                name: 'Cena',
                description: 'Arroz tres delicias casero y atún',
                foods: [
                    { quantity: '120g', name: 'Arroz blanco (peso seco)' },
                    { quantity: '112g', name: 'Atún al natural (2 latas escurridas)' },
                    { quantity: '50g', name: 'Guisantes y zanahorias cocidos' }
                ],
                calories: 700,
                protein_g: 45,
                carbs_g: 90,
                fats_g: 10,
            }
        ]
    },
    // --- NUEVA DIETA DE VOLUMEN (MENOS DE 200G PROTEÍNA) ---
    {
        id: 'gain-3',
        name: 'Volumen Intermedio (2800 kcal)',
        description: 'Volumen equilibrado con proteína moderada (170g) y alta carga de carbohidratos.',
        goal: 'gain',
        total_calories: 2800,
        total_protein: 170,
        total_carbs: 380,
        total_fats: 70,
        meals: [
            {
                id: 'gn3-m1',
                name: 'Desayuno Completo',
                description: 'Tortitas de Avena y Huevo con Miel',
                foods: [
                    { quantity: '100g', name: 'Avena molida' },
                    { quantity: '180g', name: 'Huevos (3 unidades L)' },
                    { quantity: '100g', name: 'Plátano' },
                    { quantity: '20g', name: 'Miel' }
                ],
                calories: 700,
                protein_g: 32,
                carbs_g: 95,
                fats_g: 22,
            },
            {
                id: 'gn3-m2',
                name: 'Almuerzo Energético',
                description: 'Pasta con Atún y Tomate',
                foods: [
                    { quantity: '150g', name: 'Pasta (peso en seco)' },
                    { quantity: '112g', name: 'Atún al natural (2 latas escurridas)' },
                    { quantity: '150g', name: 'Salsa de tomate frito' },
                    { quantity: '5g', name: 'Aceite de oliva virgen extra' }
                ],
                calories: 800,
                protein_g: 48,
                carbs_g: 125,
                fats_g: 13,
            },
            {
                id: 'gn3-m3',
                name: 'Merienda',
                description: 'Bocadillo de Lomo y Fruta',
                foods: [
                    { quantity: '120g', name: 'Pan de barra' },
                    { quantity: '80g', name: 'Lomo embuchado' },
                    { quantity: '150g', name: 'Manzana' }
                ],
                calories: 550,
                protein_g: 40,
                carbs_g: 75,
                fats_g: 7,
            },
            {
                id: 'gn3-m4',
                name: 'Cena Ligera',
                description: 'Arroz con Pollo y Verduras',
                foods: [
                    { quantity: '120g', name: 'Arroz blanco (peso seco)' },
                    { quantity: '150g', name: 'Pechuga de pollo' },
                    { quantity: '200g', name: 'Brócoli o Judías verdes' },
                    { quantity: '10g', name: 'Aceite de oliva' }
                ],
                calories: 750,
                protein_g: 50,
                carbs_g: 100,
                fats_g: 15,
            }
        ]
    }
];