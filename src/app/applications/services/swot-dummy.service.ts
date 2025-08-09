// src/app/shared/services/swot-analysis.service.ts
import { Injectable } from '@angular/core';
import { Observable, of, delay, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { SWOTAnalysis, SWOTCategory, SWOTItem } from '../../shared/models/swot.models';
import { dummySWOTAnalyses } from '../data/dummy-swot';
 
@Injectable({
  providedIn: 'root'
})
export class SWOTAnalysisService {
  private swotAnalysesSubject = new BehaviorSubject<SWOTAnalysis[]>([]);
  private isInitialized = false;

  constructor() {
    this.initializeDummyData();
  }

  private initializeDummyData() {
    if (this.isInitialized) return;



    this.swotAnalysesSubject.next(dummySWOTAnalyses);
    this.isInitialized = true;
  }

  // Get SWOT analysis by ID
  getSWOTAnalysisById(id: string): Observable<SWOTAnalysis | undefined> {
    return this.swotAnalysesSubject.asObservable().pipe(
      delay(300),
      map(analyses => analyses.find(swot => swot.id === id))
    );
  }

  // Get SWOT analysis by application ID
  getSWOTAnalysisByApplication(applicationId: string): Observable<SWOTAnalysis | undefined> {
    return this.swotAnalysesSubject.asObservable().pipe(
      delay(300),
      map(analyses => analyses.find(swot => swot.applicationId === applicationId))
    );
  }

  // Create new SWOT analysis
  createSWOTAnalysis(data: Partial<SWOTAnalysis>): Observable<SWOTAnalysis> {
    const newAnalysis: SWOTAnalysis = {
      id: `swot-${Date.now()}`,
      smeId: 'user-001',
      profileId: 'profile-001',
      strengths: [],
      weaknesses: [],
      opportunities: [],
      threats: [],
      strategicMatrix: { soStrategies: [], woStrategies: [], stStrategies: [], wtStrategies: [] },
      keyInsights: [],
      actionPlan: [],
      swotScores: {
        strengthsScore: 0,
        weaknessesScore: 0,
        opportunitiesScore: 0,
        threatsScore: 0,
        overallScore: 0,
        investorReadinessImpact: 0
      },
      priorityMatrix: { quickWins: [], strategicInitiatives: [], fillInProjects: [], monitorItems: [] },
      analysisContext: {
        industryContext: '',
        competitiveContext: '',
        economicContext: '',
        marketConditions: '',
        timeframe: '12 months'
      },
      completedBy: 'user-001',
      version: 1,
      isTemplate: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data
    } as SWOTAnalysis;

    return new Observable(observer => {
      setTimeout(() => {
        const current = this.swotAnalysesSubject.value;
        this.swotAnalysesSubject.next([...current, newAnalysis]);
        observer.next(newAnalysis);
        observer.complete();
      }, 500);
    });
  }

  // Update SWOT analysis
  updateSWOTAnalysis(id: string, updates: Partial<SWOTAnalysis>): Observable<SWOTAnalysis> {
    return new Observable(observer => {
      setTimeout(() => {
        const current = this.swotAnalysesSubject.value;
        const index = current.findIndex(swot => swot.id === id);
        
        if (index !== -1) {
          const updated = {
            ...current[index],
            ...updates,
            updatedAt: new Date()
          };
          
          const newArray = [...current];
          newArray[index] = updated;
          this.swotAnalysesSubject.next(newArray);
          
          observer.next(updated);
        } else {
          observer.error('SWOT analysis not found');
        }
        observer.complete();
      }, 400);
    });
  }

  // Add SWOT item
  addSWOTItem(analysisId: string, category: SWOTCategory, item: Omit<SWOTItem, 'id' | 'category' | 'createdAt' | 'createdBy'>): Observable<SWOTItem> {
    const newItem: SWOTItem = {
      id: `${category.slice(0, 3)}-${Date.now()}`,
      category,
      createdAt: new Date(),
      createdBy: 'user-001',
      ...item
    };

    return new Observable(observer => {
      setTimeout(() => {
        const current = this.swotAnalysesSubject.value;
        const index = current.findIndex(swot => swot.id === analysisId);
        
        if (index !== -1) {
          const analysis = current[index];
          const updated = {
            ...analysis,
            [category]: [...analysis[category], newItem],
            updatedAt: new Date()
          };
          
          const newArray = [...current];
          newArray[index] = updated;
          this.swotAnalysesSubject.next(newArray);
          
          observer.next(newItem);
        } else {
          observer.error('SWOT analysis not found');
        }
        observer.complete();
      }, 300);
    });
  }
} 