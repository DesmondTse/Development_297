ALTER PROCEDURE [Census].[SP_DC_GET_ASGN_BY_GUID_WO_VIEW_SCP_QC_LOG]
	@pStaffPostionUid int,

	--For get and download signle assignment
	@pAssignmentGuid uniqueidentifier,

	--Search Result for search assignment reference no and mail address
	@pSrchRslt nvarchar(max),
	@pAsgnSts nvarchar(max),
	@pSrvyUid int,
	@pScUid int,
	@pApptDate DateTime,
	@pEnqCd varchar(1),
	@pTel varchar(max),
	@pAddress nvarchar(max),

	@pTpu nvarchar(max),
	@pSb nvarchar(max),
	@pEnumRsltCd varchar(4),
	@pPlot varchar(max),
	@pApptMde varchar(2),
	@pOqReg varchar(1),
	@pRfslInd varchar(1),
	@pPrtyFrm tinyint,
	@pPrtyTo tinyint,
	@pBkmInd varchar(1),
	@pRmksInd varchar(1),
	@pReptInd varchar(1),
	@pNFAInd varchar(1),
	@pNFVInd varchar(1),
	@pHldInd varchar(1),
	@pPairVstInd varchar(1),
	@pSegInd varchar(1),
	@pSduInd varchar(1),
	@pOsInd varchar(1),
	@pBldgSerl numeric(6, 0),
	@pFuQcInd varchar(1),

	@pNoOfTtlVst int, 
	@pNoOfTtlVstOpr varchar(1),
	@pNoOfDayVst int, 
	@pNoOfDayVstOpr varchar(1),
	@pNoOfNightVst int, 
	@pNoOfNightVstOpr varchar(1),

	@pPoolOrgUnitUid int,
	@pTeamOrgUnitUid int,
	@pRespStfUid int,
	@pRespPosnUid int,

	@pBldgCsuId VARCHAR(MAX),
	@pReallocInd varchar(1),
	@pLastRoundRmksInd varchar(1),

	@pPageNum int,
	@pPageSize int,
	@pOrderJson nvarchar(max) ='{}',

	@pTotalOs int OUTPUT,
	@pTotalHld int OUTPUT,

	@pTotalPage int OUTPUT,
	@pTotalCount int OUTPUT,

	@pOfficerJson nvarchar(max) OUTPUT,
	@pSupervisorJson nvarchar(max) OUTPUT,
	@pRemarkJson nvarchar(max) OUTPUT,
	@pInterviewLogImageJson nvarchar(max) OUTPUT,
	@pInterviewLogJson nvarchar(max) OUTPUT,
	@pAssignmentDetailJson nvarchar(max) OUTPUT,
	@pActivtiyJson nvarchar(max) OUTPUT,
	@pAppointmentJson nvarchar(max) OUTPUT,
	@pContactJson nvarchar(max) OUTPUT,
	@pEnquiryLogJson nvarchar(max) OUTPUT,
	@pItineraryPlanJson nvarchar(max) OUTPUT,
	@pEFieldCardJson nvarchar(max) OUTPUT,
	@pQuestionaireVersionJson nvarchar(max) OUTPUT,
	@pSubSurveyJson nvarchar(max) OUTPUT,
	@pAdminDataPerFillJson nvarchar(max) OUTPUT,
	@pQuestionnaireImageJson nvarchar(max) OUTPUT,
	@pQcLogJson nvarchar(max) OUTPUT,
	@pQcLogSubSurveyJson nvarchar(max) OUTPUT,
    @pOQSeperateAccountJson nvarchar(max) OUTPUT
--WITH RECOMPILE
AS
BEGIN
	SET NOCOUNT ON;

	/*** Eva Fixing for load test 2024/09/26 Start ***/
	SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;	-- Enable dirty read instead of using NOLOCK in every statement
	/*** Eva Fixing for load test 2024/09/26 End ***/

	DECLARE @orderSQL nvarchar(max)
	DECLARE @sSQLString nvarchar(max)
	DECLARE @columnList nvarchar(max)
	DECLARE @spaceStr nvarchar(1)		= ' '
	DECLARE @emptyStr nvarchar(1)		= ''

	DECLARE @IntvMdeStr varchar(10)		= 'INTVMDE'
	DECLARE @ContTitlStr varchar(10)	= 'CONTTITL'
	DECLARE @ApptCanRsnStr varchar(15)	= 'APPTCANRSNCD'
	DECLARE @OqStsStr varchar(10)		= 'PROQSTS'
	DECLARE @ApptStsStr varchar(10)		= 'APPTSTS'
	DECLARE @ContTypStr varchar(10)		= 'CONTTYP'
	DECLARE @FuStsCdStr varchar(10)		= 'FUSTSCD'
	DECLARE @RfsIntvInfoStr varchar(15) = 'RFSINTVINFO'
	DECLARE @ContMethPref varchar(15)	= 'CONTMETHPREF'
	DECLARE @AsgnRefNoKey varchar(5)	= 'REFNO';
	DECLARE @PairVstIndStr varchar(15)  = 'PAIRVSTIND';
	DECLARE @AprvStsStr varchar(10)		= 'APRVSTS';
	DECLARE @RmksCatgStr varchar(10)	= 'RMKSCATG';
	DECLARE @SrchIndStr varchar(10)		= 'SRCHIND';
	DECLARE @RvwStsStr varchar(10)		= 'RVWSTS';
	DECLARE @dfStsStr varchar(10)		= 'DFSTS';
	DECLARE @rfslIndStr varchar(10)		= 'RFSLIND';
	DECLARE @rfslLvlStr varchar(10)		= 'RFSLLVL';
	DECLARE @bldgMgtStr varchar(10)		= 'BLDGMGT';
	DECLARE @pstlIndStr varchar(10)		= 'PSTLIND';
	DECLARE @ocpIndStr varchar(10)		= 'OCPIND';
	DECLARE @dfhStsStr varchar(10)		= 'DFHSTS';

	DECLARE @sPosnCd varchar(50);
	DECLARE @sStfUid int;
	DECLARE @sSupervisorPositionUid int;
	DECLARE @sQcTypUid_curs int = (SELECT TOP(1) [QC_TYP_UID] FROM [Census].[CM_REF_QC_TYP] (NOLOCK) WHERE [QC_CD] = 'CURS_CHK')
	DECLARE @sQcTypUid_inDepth int = (SELECT TOP(1) [QC_TYP_UID] FROM [Census].[CM_REF_QC_TYP] (NOLOCK) WHERE [QC_CD] = 'QCT')
	DECLARE @sQcTypUid_firstStage int = (SELECT TOP(1) [QC_TYP_UID] FROM [Census].[CM_REF_QC_TYP] (NOLOCK) WHERE [QC_CD] = '1ST_STG_NON_TS')
	DECLARE @sQcTypUid_secondStage int = (SELECT TOP(1) [QC_TYP_UID] FROM [Census].[CM_REF_QC_TYP] (NOLOCK) WHERE [QC_CD] = '2ST_STG_NON_TS')
	DECLARE @sQcStsCdStr varchar(10) = 'QCSTS'	
	DECLARE @sQcRsltCdStr varchar(10) = 'QCRSLT'
	DECLARE @sEmptyStr nvarchar(1) = ''
	DECLARE @sQcList nvarchar(max) = ''	

	SET @pTel = IIF(@pTel IS NULL, NULL, CONCAT('%',@pTel,'%'))
	SET @pPlot = IIF(@pPlot IS NULL, NULL, CONCAT('%',@pPlot,'%'))
	SET @pTpu = IIF(@pTpu IS NULL, NULL, CONCAT('%',@pTpu,'%'))
	SET @pSb = IIF(@pSb IS NULL, NULL, CONCAT('%',@pSb,'%'))
	SET @pBldgCsuId = IIF(@pBldgCsuId IS NULL, NULL, CONCAT('%',@pBldgCsuId,'%'))
	SET @pAddress = IIF(@pAddress IS NULL, NULL, CONCAT('%',@pAddress,'%'))
	
	SELECT TOP(1) @sPosnCd = posn.[POSN_CD], @sStfUid = [STF_UID], @sSupervisorPositionUid = stfPosn.[POSN_UID] FROM [Census].[VW_CM_GET_CURR_STF_POSN] stfPosn
	INNER JOIN [Census].[CM_POSN] posn (NOLOCK) ON posn.[POSN_UID] = stfPosn.[POSN_UID]
	WHERE stfPosn.[STF_POSN_UID] = @pStaffPostionUid;

	DROP TABLE IF EXISTS #assignmentList

	CREATE TABLE #assignmentList(
		[ASGN_UID] bigint,
		[POSN_RT] nvarchar(max),
		[NAME_ENG] nvarchar(max),
		[NAME_CHI] nvarchar(max),
		[STF_POSN_UID] int,
		[DL_ASGN] bit,
		[IS_SHOW] bit
	)

	CREATE NONCLUSTERED INDEX ix_assignmentList ON #assignmentList ([ASGN_UID]);

	--If search by guid, skip paging and fiter
	IF @pAssignmentGuid IS NOT NULL
	BEGIN

		INSERT INTO #assignmentList ([ASGN_UID], [POSN_RT], [NAME_ENG], [NAME_CHI], [STF_POSN_UID], [DL_ASGN], [IS_SHOW])
		SELECT asgn.ASGN_UID, '', stfProf.[NAME_ENG], stfProf.[NAME_CHI], stfPosn.[STF_POSN_UID], 1, 1
		FROM [Census].[CM_ASGN_MAIN] asgn
		LEFT JOIN [Census].[CM_ASGN_ALLOC] alloc (NOLOCK) ON asgn.ASGN_UID = alloc.ASGN_UID
		LEFT JOIN [Census].[VW_CM_GET_CURR_STF_POSN] stfPosn ON stfPosn.[STF_POSN_UID] = alloc.[STF_POSN_UID_ENUM]
		LEFT JOIN [Census].[CM_STF_PROF] stfProf (NOLOCK) ON stfProf.[STF_UID] = stfPosn.[STF_UID]
		--INNER JOIN #tempAssignmentListVwScp AsgnLstVwScp on  AsgnLstVwScp.[ASGN_UID] = asgn.[ASGN_UID]
		WHERE asgn.[GUID] = @pAssignmentGuid
	END
	ELSE
	BEGIN
	
		--Get the itinerary plan approved and downloaded assignment by staff uid
		INSERT INTO #assignmentList([ASGN_UID], [POSN_RT], [NAME_ENG], [NAME_CHI], [STF_POSN_UID], [DL_ASGN])
		exec [Census].[SP_DC_GET_ASGN_BY_STF_UID] @sStfUid;

		UPDATE #assignmentList SET [IS_SHOW] = 0

		CREATE TABLE #assignmentCountResult(
			[ASGN_UID] bigint
			,[FLD_OS_IND] varchar(1)
			,[HLD_STS] varchar(1)
		)

		IF @pPageNum <> -1
		BEGIN
			DECLARE @sResultJosn nvarchar(max)
			DECLARE @pos INT
			DECLARE @len INT
			DECLARE @value nvarchar(1000)

			exec [Census].[SP_CM_GET_ASGN_BY_STF_POSN_UID_N_SYS_CD] @pStaffPostionUid,'DCP', @sResultJosn OUTPUT

			SELECT tempAssignmentList.*
			INTO #tempAssignmentList
			FROM
				OPENJSON(@sResultJosn)
			WITH (
				[ASGN_UID] bigint '$.ASGN_UID'
			) tempAssignmentList

			CREATE NONCLUSTERED INDEX ix_tempAssignmentList ON #tempAssignmentList ([ASGN_UID]);

			DROP TABLE IF EXISTS #tempQcInd

			SELECT ASGN_UID, QC_IND 
			INTO #tempQcInd
			FROM (
				SELECT
					asgn.ASGN_UID,
					CASE
						WHEN qcLog.QC_LOG_UID IS NULL THEN 'N'
						WHEN qcLog.QC_STS <> 'S' THEN 'Y'
						WHEN qcLog.QC_STS = 'S' AND qcLog.UPD_BY_STF_POSN_UID = qDataInfo.CRE_BY_STF_POSN_UID THEN 'Y'
						ELSE 'N'
					END [QC_IND]
				FROM Census.CM_ASGN_MAIN asgn
				LEFT JOIN Census.CM_QC_LOG qcLog ON asgn.ASGN_UID = qcLog.ASGN_UID
				LEFT JOIN Census.CM_Q_DATA_INFO qDataInfo ON qDataInfo.ASGN_UID = asgn.ASGN_UID AND qDataInfo.[Q_DATA_TYP] = 'FUQC'				
			) temp
			GROUP BY ASGN_UID, QC_IND

			SELECT @columnList = COALESCE(@columnList + ',' + [name], [name])
			FROM   tempdb.sys.columns
			WHERE  object_id = Object_id('tempdb..#result'); 
			/*Table Name is for searching whether the field name is valid*/
			SELECT @orderSQL = [Census].FN_GetOrderSQL(@columnList, @pOrderJson, DEFAULT)

			SET @sSQLString = N'

			SELECT enqLogAsgn.[ASGN_UID]
					,MAX(enqLog.[CASE_LOG_UID]) [CASE_LOG_UID]
			into #enqlogStatus
			FROM [Census].[CM_ENQ_LOG_ASGN] (NOLOCK) enqLogAsgn
			INNER JOIN [Census].[CM_ENQ_LOG] (NOLOCK) enqLog ON enqLog.[CASE_LOG_UID] = enqLogAsgn.[CASE_LOG_UID]
			GROUP BY enqLogAsgn.[ASGN_UID]
			CREATE NONCLUSTERED INDEX ix_enqlogStatus ON #enqlogStatus ([ASGN_UID]);


			SELECT asgn.[ASGN_UID]
					,enqLog.[FU_STS_CD]
			into #followUpStatus
			FROM [Census].[CM_ASGN_MAIN] (NOLOCK) asgn
			INNER JOIN #enqlogStatus (NOLOCK) ON #enqlogStatus.[ASGN_UID] = asgn.[ASGN_UID]
			INNER JOIN [Census].[CM_ENQ_LOG] (NOLOCK) enqLog ON enqLog.[CASE_LOG_UID] = #enqlogStatus.[CASE_LOG_UID]
			CREATE NONCLUSTERED INDEX ix_followUpStatus ON #followUpStatus ([ASGN_UID]);


			SELECT appt.[ASGN_UID]
					,MAX(appt.[APPT_UID]) [APPT_UID]
			into #maxDateAppointment
			FROM [Census].[CM_APPT] (NOLOCK) appt
			WHERE appt.[APPT_STS] = ''B'' 
			GROUP BY appt.[ASGN_UID]
			CREATE NONCLUSTERED INDEX ix_maxDateAppointment ON #maxDateAppointment ([ASGN_UID]);

			'
			if (@pTel is not NULL) 
			BEGIN 
				SET @sSQLString = @sSQLString + N' 
					SELECT asgnHhCont.[ASGN_UID],
					MAX(asgnHhCont.[HH_CONT_UID]) [HH_CONT_UID]
					into #Contact
					FROM [Census].[CM_ASGN_HH_CONT] (NOLOCK) asgnHhCont
					WHERE @pTel IS NULL OR asgnHhCont.[TEL_1] LIKE @pTel OR asgnHhCont.[TEL_2] LIKE @pTel
					GROUP BY asgnHhCont.[ASGN_UID]
					CREATE NONCLUSTERED INDEX ix_Contact ON #Contact ([ASGN_UID]);
					
					SELECT efcHhCont.[ASGN_UID],
					MAX(efcHhCont.[CONT_UID]) [CONT_UID]
					into #eFieldCardContact
					FROM [Census].[CM_EFC_HH_CONT] efcHhCont (NOLOCK)
					WHERE @pTel IS NULL OR efcHhCont.[TEL_1] LIKE @pTel OR efcHhCont.[TEL_2] LIKE @pTel
					GROUP BY efcHhCont.[ASGN_UID]
					CREATE NONCLUSTERED INDEX ix_eFieldCardContact ON #eFieldCardContact ([ASGN_UID]);'
			END

			SET @sSQLString = @sSQLString + N'

			SELECT asgnRmks.[ASGN_UID]
					,MAX(asgnRmks.[ASGN_RMKS_UID]) [ASGN_RMKS_UID]
			into #asgnRmks
			FROM [Census].[CM_ASGN_RMKS] (NOLOCK) asgnRmks
			WHERE asgnRmks.[STS] = ''A''
			GROUP BY asgnRmks.[ASGN_UID]
			CREATE NONCLUSTERED INDEX ix_asgnRmks ON #asgnRmks ([ASGN_UID]);

			SELECT  CM_ASGN_ALLOC_HIST.ASGN_UID, CM_ASGN_ALLOC_HIST.POSN_UID
			INTO #VIEW_ASGN_ALLOC_HIST
			FROM [Census].CM_ASGN_ALLOC_HIST (NOLOCK) 
			WHERE ALLOC_TYP IN (''R'',''T'',''RFU'')
			CREATE NONCLUSTERED INDEX ix_VIEW_ASGN_ALLOC_HIST ON #VIEW_ASGN_ALLOC_HIST ([ASGN_UID]);

			SELECT ASGN_UID, COUNT(1) NUM_OF_RMKS
			into #lastRoundRmks
			FROM Census.CM_ASGN_RMKS (NOLOCK) 
			WHERE STS = ''A''
			GROUP BY ASGN_UID
			CREATE NONCLUSTERED INDEX ix_lastRoundRmks ON #lastRoundRmks ([ASGN_UID]);

			'

			create table #searchResult (ASGN_UID bigint)

			if (@pSrchRslt is not NULL) 
			BEGIN 

					SELECT DISTINCT CAST(value AS NVARCHAR(450)) as value
					INTO   #searchString
					FROM   STRING_SPLIT(ISNULL(@pSrchRslt, ''), ';');
					--CREATE UNIQUE INDEX ix_searchString ON #searchString ([value]);

					INSERT INTO #searchResult
					SELECT asgn.[ASGN_UID]
					FROM #tempAssignmentList asgnList
					INNER JOIN [Census].[CM_ASGN_MAIN] asgn WITH (NOLOCK) ON asgn.ASGN_UID = asgnList.ASGN_UID
					INNER JOIN #searchString searchResult ON
					--INNER JOIN [Census].[CM_ASGN_MAIN] asgn WITH (NOLOCK) ON 
					(@pSrchRslt IS NULL 
						OR CONCAT_WS(
							', '
							,IIF(TRIM(ISNULL(asgn.[MAIL_ADDR_ENG_1],''))='',NULL,TRIM(asgn.[MAIL_ADDR_ENG_1]))
							,IIF(TRIM(ISNULL(asgn.[MAIL_ADDR_ENG_2],''))='',NULL,TRIM(asgn.[MAIL_ADDR_ENG_2]))
							,IIF(TRIM(ISNULL(asgn.[MAIL_ADDR_ENG_3],''))='',NULL,TRIM(asgn.[MAIL_ADDR_ENG_3]))
							,IIF(TRIM(ISNULL(asgn.[MAIL_ADDR_ENG_4],''))='',NULL,TRIM(asgn.[MAIL_ADDR_ENG_4]))
							,IIF(TRIM(ISNULL(asgn.[MAIL_ADDR_ENG_5],''))='',NULL,TRIM(asgn.[MAIL_ADDR_ENG_5]))
							,IIF(TRIM(ISNULL(asgn.[MAIL_ADDR_ENG_6],''))='',NULL,TRIM(asgn.[MAIL_ADDR_ENG_6]))
						) LIKE CONCAT('%',searchResult.value,'%')
						OR CONCAT_WS(
							', '
							,IIF(TRIM(ISNULL(asgn.[MAIL_ADDR_CHI_5],''))='',NULL,TRIM(asgn.[MAIL_ADDR_CHI_5]))
							,IIF(TRIM(ISNULL(asgn.[MAIL_ADDR_CHI_4],''))='',NULL,TRIM(asgn.[MAIL_ADDR_CHI_4]))
							,IIF(TRIM(ISNULL(asgn.[MAIL_ADDR_CHI_3],''))='',NULL,TRIM(asgn.[MAIL_ADDR_CHI_3]))
							,IIF(TRIM(ISNULL(asgn.[MAIL_ADDR_CHI_2],''))='',NULL,TRIM(asgn.[MAIL_ADDR_CHI_2]))
							,IIF(TRIM(ISNULL(asgn.[MAIL_ADDR_CHI_1],''))='',NULL,TRIM(asgn.[MAIL_ADDR_CHI_1]))
						) LIKE CONCAT('%',searchResult.value,'%')
						OR asgn.[ASGN_REF_NO] LIKE CONCAT('%',searchResult.value,'%')
					)

					CREATE NONCLUSTERED INDEX ix_searchResult ON #searchResult ([ASGN_UID]);
			END

			SET @sSQLString = @sSQLString + N'

			SELECT 
				[ASGN_UID],
				[POSN_RT],
				[NAME_ENG],
				[NAME_CHI],
				[STF_POSN_UID],
				[DL_ASGN],
				[IS_SHOW],
				[FLD_OS_IND],
				[HLD_STS]
			into #asgnCountResult
			FROM (
				SELECT asgn.[ASGN_UID]
				  ,@sPosnCd [POSN_RT]
				  ,respStfProf.[NAME_ENG]
				  ,respStfProf.[NAME_CHI]
				  ,asgnAlloc.[STF_POSN_UID]
				  ,CAST(0 AS BIT) [DL_ASGN]
				  ,CAST(1 AS BIT) [IS_SHOW]
				  ,cfgAsgnSts.[FLD_OS_IND]
				  ,asgnHldLst.[HLD_STS]
				  ,CONCAT(
            	   	   IIF(asgn.MAIL_ADDR_ENG_1 IS NULL, @emptyStr, asgn.MAIL_ADDR_ENG_1)
            	   	   ,IIF(asgn.MAIL_ADDR_ENG_2 IS NULL, @emptyStr, '', '' + asgn.MAIL_ADDR_ENG_2)
            	   	   ,IIF(asgn.MAIL_ADDR_ENG_3 IS NULL, @emptyStr, '', '' + asgn.MAIL_ADDR_ENG_3)
            	   	   ,IIF(asgn.MAIL_ADDR_ENG_4 IS NULL, @emptyStr, '', '' + asgn.MAIL_ADDR_ENG_4)
            	   	   ,IIF(asgn.MAIL_ADDR_ENG_5 IS NULL, @emptyStr, '', '' + asgn.MAIL_ADDR_ENG_5)
            	   ) [ADDR_ENG]
				   ,CONCAT(
            	   	    IIF(isnull(asgn.MAIL_ADDR_CHI_1,@emptyStr)=@emptyStr, @emptyStr, asgn.MAIL_ADDR_CHI_1 + '', '' )
            	   	   ,IIF(isnull(asgn.MAIL_ADDR_CHI_2,@emptyStr)=@emptyStr, @emptyStr, asgn.MAIL_ADDR_CHI_2 + '', '' )
            	   	   ,IIF(isnull(asgn.MAIL_ADDR_CHI_3,@emptyStr)=@emptyStr, @emptyStr,  asgn.MAIL_ADDR_CHI_3 + '', '' )
            	   	   ,IIF(isnull(asgn.MAIL_ADDR_CHI_4,@emptyStr)=@emptyStr, @emptyStr,  asgn.MAIL_ADDR_CHI_4 + '', '' )
            	   	   ,IIF(isnull(asgn.MAIL_ADDR_CHI_5,@emptyStr)=@emptyStr, @emptyStr,  asgn.MAIL_ADDR_CHI_5 )
            		) [ADDR_CHI]
			FROM #tempAssignmentList asgnLst
			INNER JOIN [Census].[CM_ASGN_MAIN] (NOLOCK) asgn			ON asgnLst.[ASGN_UID] = asgn.[ASGN_UID]
			'
			if (@pSrchRslt is not NULL)  
			BEGIN 
				SET @sSQLString = @sSQLString + N' 
				INNER JOIN #searchResult searchResult ON searchResult.[ASGN_UID] = asgn.[ASGN_UID]'
			END

			SET @sSQLString = @sSQLString + N'
			INNER JOIN [Census].[CM_SC] (NOLOCK) sc						ON sc.[SC_UID] = asgn.[SC_UID]
			INNER JOIN [Census].[CM_SRVY] (NOLOCK) srvy					ON srvy.[SRVY_UID] = sc.[SRVY_UID] AND srvy.[SRVY_TYP] = ''HH''
			LEFT JOIN [Census].[VW_CM_GET_ASGN_ALLOC_RESP] (NOLOCK) asgnAlloc ON asgnAlloc.[ASGN_UID] = asgn.[ASGN_UID]
			LEFT JOIN [Census].[VW_CM_GET_CURR_STF_POSN] (NOLOCK) respStfPosn		ON asgnAlloc.[POSN_UID] = respStfPosn.[POSN_UID] AND respStfPosn.STS = ''A'' AND respStfPosn.STF_POSN_UID = @pStaffPostionUid
			LEFT JOIN [Census].[CM_POSN] (NOLOCK) respPosn				ON respPosn.[POSN_UID] = respStfPosn.[POSN_UID]
			LEFT JOIN [Census].[CM_STF_PROF] (NOLOCK) respStfProf		ON respStfProf.[STF_UID] = respStfPosn.[STF_UID]
			LEFT JOIN [Census].[CM_ORG_UNIT] (NOLOCK) teamOrgUnit		ON teamOrgUnit.[OU_UID] = respPosn.[OU_UID]
			LEFT  JOIN [Census].[CM_ORG_UNIT] (NOLOCK) poolOrgUnit		ON poolOrgUnit.[OU_UID] = teamOrgUnit.[PAR_OU_UID] AND poolOrgUnit.[FLD_POOL_IND] = ''Y''
			INNER JOIN [Census].[CM_QTR] (NOLOCK) qtr					ON qtr.[QTR_UID] = asgn.[QTR_UID]
			LEFT JOIN [Census].[CM_QTR_ADDR] (NOLOCK) qtrAddr				ON qtr.[QTR_UID]				= qtrAddr.[QTR_UID]
			LEFT JOIN [Census].[CM_BLDG_ADDR] (NOLOCK) bldgAddr				ON bldgAddr.[BLDG_ADDR_UID]		= qtrAddr.[BLDG_ADDR_UID]
			INNER JOIN [Census].[CM_BLDG] (NOLOCK) bldg						ON bldg.[BLDG_UID]				= bldgAddr.[BLDG_UID]	  
			LEFT  JOIN [Census].[CM_REF_DC] (NOLOCK)	refDc				ON refDc.[DC] = bldg.[DC]
			INNER JOIN [Census].[CM_REF_DCCA] (NOLOCK) refDcca			ON refDcca.[CA]		= bldg.[CA] AND refDcca.[DC] = bldg.[DC]
			'
			if (@pTel is not NULL)  
			BEGIN 
				SET @sSQLString = @sSQLString + N' 
				LEFT  JOIN #Contact (NOLOCK)	Contact							ON Contact.[ASGN_UID] = asgn.[ASGN_UID]
				LEFT  JOIN #eFieldCardContact (NOLOCK) efcHhCont				ON efcHhCont.[ASGN_UID] = asgn.[ASGN_UID]'
			END

			SET @sSQLString = @sSQLString + N'
			LEFT  JOIN #maxDateAppointment (NOLOCK) maxDateAppointment	ON maxDateAppointment.[ASGN_UID] = asgn.[ASGN_UID]
			LEFT  JOIN [Census].[CM_APPT] (NOLOCK) appt					ON appt.[APPT_UID] = maxDateAppointment.[APPT_UID]
			LEFT  JOIN [Census].[CM_SEG] (NOLOCK) seg					ON seg.[SEG_UID] = bldg.[SEG_UID]
			LEFT  JOIN [Census].[CM_USR_ASGN_BKM] (NOLOCK) usrAsgnBkm	ON usrAsgnBkm.[STF_UID] = @sStfUid AND usrAsgnBkm.[ASGN_UID] = asgn.[ASGN_UID] AND usrAsgnBkm.[STS] = ''A''
			LEFT  JOIN #asgnRmks (NOLOCK) asgnRmks						ON asgnRmks.[ASGN_UID] = asgn.[ASGN_UID]
			LEFT  JOIN #asgnRmks lastRoundasgnRmks						ON lastRoundasgnRmks.[ASGN_UID] = asgn.[PREV_ASGN_UID]
			LEFT  JOIN [Census].[CM_ASGN_HLD_LST] (NOLOCK) asgnHldLst	ON asgnHldLst.[ASGN_UID] = asgn.[ASGN_UID] 
			LEFT  JOIN #followUpStatus (NOLOCK) followUpStatus			ON followUpStatus.[ASGN_UID] = asgn.[ASGN_UID]
			LEFT  JOIN [Census].[CM_CFG_ASGN_STS] (NOLOCK) cfgAsgnSts	ON cfgAsgnSts.[ASGN_STS] = asgn.[ASGN_STS] AND cfgAsgnSts.[SRVY_UID] = srvy.[SRVY_UID]
			'
			if (@pReallocInd = 'Y') 
			BEGIN 
				SET @sSQLString = @sSQLString + N' 
				INNER  JOIN #VIEW_ASGN_ALLOC_HIST ASGN_ALLOC_HIST ON ASGN_ALLOC_HIST.ASGN_UID = asgn.[ASGN_UID] -- Mantis 2519	'
			END

			SET @sSQLString = @sSQLString + N'
			LEFT  JOIN #lastRoundRmks ON #lastRoundRmks.[ASGN_UID] = asgn.[PREV_ASGN_UID]
			LEFT  JOIN #tempQcInd ON #tempQcInd.[ASGN_UID] = asgn.[ASGN_UID]
			--filter
			WHERE asgn.[ASGN_STS] <> ''NEW''
			--AND ((@pFuQcInd = ''Y'' AND asgn.FU_QC_IND LIKE ''%QC%'') OR ((@pFuQcInd IS NULL OR @pFuQcInd = ''N'') AND (asgn.FU_QC_IND IS NULL OR asgn.FU_QC_IND NOT LIKE ''%QC%'')))
			AND (@pFuQcInd IS NULL OR  @pFuQcInd = #tempQcInd.[QC_IND])
			AND ISNULL(asgn.[NEW_ASGN_TYP], '''') <> ''SUB''
			AND (asgn.[ASGN_STS] IN ( SELECT value FROM OPENJSON(@pAsgnSts)) OR @pAsgnSts IS NULL)
			AND (srvy.[SRVY_UID] = @pSrvyUid OR @pSrvyUid IS NULL)
			AND (sc.[SC_UID] = @pScUid OR @pScUid IS NULL)
			AND srvy.[SRVY_TYP] = ''HH''
			AND (@pPlot IS NULL OR bldg.[PLOT] LIKE @pPlot)
			AND (CAST(appt.[APPT_DT_NEW] as DATE) = CAST(@pApptDate AS DATE) OR @pApptDate IS NULL)
			AND (ISNULL(followUpStatus.[FU_STS_CD], ''N'') = @pEnqCd OR @pEnqCd IS NULL)
			AND (asgnAlloc.[STF_UID] = @pRespStfUid OR @pRespStfUid IS NULL)
			'
			if (@pTel is not NULL)  
			BEGIN 
				SET @sSQLString = @sSQLString + N' 
				AND (Contact.[HH_CONT_UID] IS NOT NULL OR efcHhCont.[CONT_UID] IS NOT NULL )'
			END

			SET @sSQLString = @sSQLString + N'
			AND (@pTpu IS NULL OR bldg.[TPU] LIKE @pTpu)
			AND (@pSb IS NULL OR bldg.[SB] LIKE @pSb)
			AND (@pEnumRsltCd IS NULL OR asgn.[ENUM_RSLT_CD] = @pEnumRsltCd)
			AND (@pApptMde IS NULL OR appt.[INTV_MDE] = @pApptMde)
			AND (@pOqReg IS NULL OR asgn.[OQ_ACCT_IND] = @pOqReg)
			AND (@pRfslInd IS NULL OR asgn.[RFSL_IND] = @pRfslInd)
			AND (ISNULL(asgn.[ASGN_PRTY], 50) BETWEEN ISNULL(@pPrtyFrm, 1) AND ISNULL(@pPrtyTo, 100))
			AND (	(usrAsgnBkm.[ASGN_UID] IS NULL AND @pBkmInd = ''N'') 
				OR	(usrAsgnBkm.[ASGN_UID] IS NOT NULL AND @pBkmInd = ''Y'') 
				OR	@pBkmInd IS NULL
				)
			AND (	(asgnRmks.[ASGN_RMKS_UID] IS NULL AND @pRmksInd = ''N'') 
				OR	(asgnRmks.[ASGN_RMKS_UID] IS NOT NULL AND @pRmksInd = ''Y'') 
				OR	@pRmksInd IS NULL
				)
			AND (	(asgn.[PREV_ASGN_UID] IS NULL AND @pReptInd = ''N'') 
				OR	(asgn.[PREV_ASGN_UID] IS NOT NULL AND @pReptInd = ''Y'') 
				OR	@pReptInd IS NULL
				)
			AND (bldg.[BLDG_SERL] = @pBldgSerl OR @pBldgSerl IS NULL)
			AND (asgn.[NFA_IND] = @pNFAInd OR @pNFAInd IS NULL)
			AND (asgn.[NFV_IND] = @pNFVInd OR @pNFVInd IS NULL)
			AND (IIF(asgnHldLst.[HLD_STS] = ''H'', ''Y'', ''N'') = @pHldInd OR @pHldInd IS NULL)
			AND (qtr.[PAIR_VST_IND] = @pPairVstInd OR @pPairVstInd IS NULL)
			AND (	(bldg.[SEG_UID] IS NULL AND @pSegInd = ''N'') 
				OR	(bldg.[SEG_UID] IS NOT NULL AND @pSegInd = ''Y'') 
				OR	@pSegInd IS NULL
				)
			AND (bldg.[BLDG_SDU] = @pSduInd OR @pSduInd IS NULL)
			AND (@pBldgCsuId IS NULL OR bldg.[BLDG_CSUID_LST] LIKE @pBldgCsuId)
			'
			if (@pNoOfTtlVst is not NULL and @pNoOfTtlVstOpr IS not NULL)  
			BEGIN 
				SET @sSQLString = @sSQLString + N' 
				AND (	(@pNoOfTtlVstOpr = ''>'' AND ISNULL(asgn.[NCD_FC_SUM],0) + ISNULL(asgn.[NCD_CSC_SUM],0) + ISNULL(asgn.[NCN_FC_SUM],0) + ISNULL(asgn.[NCN_CSC_SUM],0) > @pNoOfTtlVst) 
				OR	(@pNoOfTtlVstOpr = ''='' AND ISNULL(asgn.[NCD_FC_SUM],0) + ISNULL(asgn.[NCD_CSC_SUM],0) + ISNULL(asgn.[NCN_FC_SUM],0) + ISNULL(asgn.[NCN_CSC_SUM],0) = @pNoOfTtlVst) 
				OR	(@pNoOfTtlVstOpr = ''<'' AND ISNULL(asgn.[NCD_FC_SUM],0) + ISNULL(asgn.[NCD_CSC_SUM],0) + ISNULL(asgn.[NCN_FC_SUM],0) + ISNULL(asgn.[NCN_CSC_SUM],0) < @pNoOfTtlVst) 
				)'
			END

			if (@pNoOfDayVst is not NULL and @pNoOfDayVstOpr IS not NULL)  
			BEGIN 
				SET @sSQLString = @sSQLString + N' 
				AND (	(@pNoOfDayVstOpr = ''>'' AND ISNULL(asgn.[NCD_FC_SUM],0) + ISNULL(asgn.[NCD_CSC_SUM],0) > @pNoOfDayVst) 
				OR	(@pNoOfDayVstOpr = ''='' AND ISNULL(asgn.[NCD_FC_SUM],0) + ISNULL(asgn.[NCD_CSC_SUM],0) = @pNoOfDayVst) 
				OR	(@pNoOfDayVstOpr = ''<'' AND ISNULL(asgn.[NCD_FC_SUM],0) + ISNULL(asgn.[NCD_CSC_SUM],0) < @pNoOfDayVst) 
				)'
			END

			if (@pNoOfNightVst is not NULL and @pNoOfNightVstOpr IS not NULL)  
			BEGIN 
				SET @sSQLString = @sSQLString + N' 
				AND (	(@pNoOfNightVstOpr = ''>'' AND ISNULL(asgn.[NCN_FC_SUM],0) + ISNULL(asgn.[NCN_CSC_SUM],0) > @pNoOfNightVst) 
				OR	(@pNoOfNightVstOpr = ''='' AND ISNULL(asgn.[NCN_FC_SUM],0) + ISNULL(asgn.[NCN_CSC_SUM],0) = @pNoOfNightVst) 
				OR	(@pNoOfNightVstOpr = ''<'' AND ISNULL(asgn.[NCN_FC_SUM],0) + ISNULL(asgn.[NCN_CSC_SUM],0) < @pNoOfNightVst) 
				)'
			END

			SET @sSQLString = @sSQLString + N'
			AND (poolOrgUnit.[OU_UID] = @pPoolOrgUnitUid OR @pPoolOrgUnitUid IS NULL)
			AND (teamOrgUnit.[OU_UID] = @pTeamOrgUnitUid OR @pTeamOrgUnitUid IS NULL)
			AND (asgnAlloc.[POSN_UID] = @pRespPosnUid OR @pRespPosnUid IS NULL)
			AND (asgnAlloc.[STF_UID] = @pRespStfUid OR @pRespStfUid IS NULL)
			AND (ISNULL(cfgAsgnSts.[FLD_OS_IND], ''N'') = @pOsInd OR @pOsInd IS NULL)
			AND (@pLastRoundRmksInd IS NULL OR 
				(@pLastRoundRmksInd = ''Y'' AND ISNULL(#lastRoundRmks.NUM_OF_RMKS,0) > 0) OR
				(@pLastRoundRmksInd = ''N'' AND ISNULL(#lastRoundRmks.NUM_OF_RMKS,0) = 0)
			)
			) t
			WHERE (@pAddress IS NULL OR ADDR_ENG LIKE @pAddress OR ADDR_CHI LIKE @pAddress)
			'
			
			SET @sSQLString = @sSQLString + N'

			CREATE NONCLUSTERED INDEX ix_asgnCountResult ON #asgnCountResult ([ASGN_UID]);
	
			INSERT INTO #assignmentCountResult([ASGN_UID],[FLD_OS_IND], [HLD_STS])
			SELECT [ASGN_UID],[FLD_OS_IND], [HLD_STS] FROM #asgnCountResult

			SELECT *
			into #asgnResult
			FROM #asgnCountResult
			'

			if (Len(@orderSQL) > 0)
			begin
				set @sSQLString += @orderSQL
			end
	
			set @sSQLString += N'
				OFFSET ' + CAST(@pPageSize as nvarchar(20)) + '* (' + CAST(@pPageNum as nvarchar(20)) + '- 1 ) ROWS
				FETCH NEXT ' + CAST(@pPageSize as nvarchar(20)) +' ROWS ONLY;

				CREATE NONCLUSTERED INDEX ix_asgnResult ON #asgnResult ([ASGN_UID]);

				INSERT INTO #assignmentList([ASGN_UID], [POSN_RT], [NAME_ENG], [NAME_CHI], [STF_POSN_UID], [DL_ASGN], [IS_SHOW])
				SELECT [ASGN_UID], [POSN_RT], [NAME_ENG], [NAME_CHI], [STF_POSN_UID], [DL_ASGN], [IS_SHOW] FROM #asgnResult

				DROP TABLE IF EXISTS #Contact
				DROP TABLE IF EXISTS #eFieldCardContact
				DROP TABLE IF EXISTS #asgnRmks
				DROP TABLE IF EXISTS #followUpStatus
				DROP TABLE IF EXISTS #asgn
				DROP TABLE IF EXISTS #asgn
				DROP TABLE IF EXISTS #asgn
				DROP TABLE IF EXISTS #sumNCbyQC
				DROP TABLE IF EXISTS #VIEW_ASGN_ALLOC_HIST
				DROP TABLE IF EXISTS #lastRoundRmks
			'
			PRINT @sSQLString

			DECLARE @paramFilters nvarchar(max) = N'
			@pStaffPostionUid int,
			@sStfUid int,
			@pSrvyUid int,
			@pScUid int,
			@pSrchRslt nvarchar(max),
			@pAsgnSts nvarchar(max),
			@pApptDate DateTime,
			@pEnqCd varchar(1),
			@pTel varchar(max),
			@pTpu nvarchar(max),
			@pSb nvarchar(max),
			@pEnumRsltCd varchar(4),
			@pPlot varchar(max),
			@pApptMde varchar(2),
			@pOqReg varchar(1),
			@pRfslInd varchar(1),
			@pPrtyFrm tinyint,
			@pPrtyTo tinyint,
			@pBkmInd varchar(1),
			@pRmksInd varchar(1),
			@pReptInd varchar(1),
			@pNFAInd varchar(1),
			@pNFVInd varchar(1),
			@pHldInd varchar(1),
			@pPairVstInd varchar(1),
			@pSegInd varchar(1),
			@pSduInd varchar(1),
			@pBldgSerl numeric(6, 0),
			@pNoOfTtlVst int, 
			@pNoOfTtlVstOpr varchar(1),
			@pNoOfDayVst int, 
			@pNoOfDayVstOpr varchar(1),
			@pNoOfNightVst int, 
			@pNoOfNightVstOpr varchar(1),
			@pPoolOrgUnitUid int,
			@pTeamOrgUnitUid int,
			@pRespStfUid int,
			@pRespPosnUid int,
			@sPosnCd varchar(50),
			@pOsInd varchar(1),
			@dfhStsStr varchar(10),
			@pBldgCsuId VARCHAR(MAX),
			@pReallocInd varchar(1),
			@pLastRoundRmksInd varchar(1),
			@pFuQcInd varchar(1),
			@pAddress NVARCHAR(MAX),
			@emptyStr nvarchar(1)
			'

			EXEC sp_executesql @sSQLString, @paramFilters, 
			@pStaffPostionUid,
			@sStfUid,

			@pSrvyUid,
			@pScUid,
			@pSrchRslt,
			@pAsgnSts,
			@pApptDate,
			@pEnqCd,
			@pTel,
			@pTpu,
			@pSb,
			@pEnumRsltCd,
			@pPlot,
			@pApptMde,
			@pOqReg,
			@pRfslInd,
			@pPrtyFrm,
			@pPrtyTo,
			@pBkmInd,
			@pRmksInd,
			@pReptInd,
			@pNFAInd,
			@pNFVInd,
			@pHldInd,
			@pPairVstInd,
			@pSegInd,
			@pSduInd,
			@pBldgSerl,

			@pNoOfTtlVst, 
			@pNoOfTtlVstOpr,
			@pNoOfDayVst, 
			@pNoOfDayVstOpr,
			@pNoOfNightVst, 
			@pNoOfNightVstOpr,

			@pPoolOrgUnitUid,
			@pTeamOrgUnitUid,
			@pRespStfUid,
			@pRespPosnUid,
			@sPosnCd,
			@pOsInd,
			@dfhStsStr,
			@pBldgCsuId,
			@pReallocInd,
			@pLastRoundRmksInd,
			@pFuQcInd,
			@pAddress,
			@emptyStr
		END
	END
	--Output result

	SELECT [ASGN_UID],
			MAX(CAST(ISNULL([DL_ASGN], 0) AS INT)) [DL_ASGN],
			MAX(CAST(ISNULL([IS_SHOW], 0) AS INT)) [IS_SHOW],
			STRING_AGG([POSN_RT], ',') [POSN_RT]
	into #assignmentsGroup
	FROM #assignmentList
	GROUP BY [ASGN_UID]
	CREATE NONCLUSTERED INDEX ix_assignmentsGroup ON #assignmentsGroup ([ASGN_UID]);
	SELECT asgn.*,[DL_ASGN],[IS_SHOW],[POSN_RT]
	into #assignments
	FROM #assignmentsGroup
	INNER JOIN [Census].[CM_ASGN_MAIN] asgn (NOLOCK) ON #assignmentsGroup.[ASGN_UID] = asgn.[ASGN_UID]
	CREATE NONCLUSTERED INDEX ix_temp_ASGN_UID ON #assignments ([ASGN_UID]);

	--Officer List in Assignment detail
	DROP TABLE IF EXISTS #cteLastASGN_ALLOCSummary
	
	;With cteASGN_HIST AS(
		select  ROW_NUMBER() OVER(PARTITION BY CM_ASGN_ALLOC.ASGN_UID 
		ORDER BY CM_ASGN_ALLOC_HIST.cre_dt desc) RowNum,
		CM_ASGN_ALLOC.ASGN_UID,
		CM_ASGN_ALLOC_HIST.POSN_UID
		FROM #assignments asgn
		INNER JOIN census.CM_ASGN_ALLOC (NOLOCK) CM_ASGN_ALLOC ON CM_ASGN_ALLOC.ASGN_UID = asgn.ASGN_UID
		left JOIN CENSUS.CM_ASGN_ALLOC_HIST (NOLOCK) ON CM_ASGN_ALLOC_HIST.ASGN_UID=CM_ASGN_ALLOC.ASGN_UID
	)
	SELECT cteASGN_HIST.ASGN_UID,	
		CM_ASGN_ALLOC.ALLOC_TO_IND,
		case when CM_ASGN_ALLOC.ALLOC_TO_IND = 'O' THEN isnull(LAST_CM_ORG_UNIT.NAME_ENG,ENUM_CM_POSN.NAME_ENG) else LAST_CM_ORG_UNIT.NAME_ENG end   LastFieldTeam,
		case when CM_ASGN_ALLOC.ALLOC_TO_IND = 'O' then isnull(LAST_CM_POSN.POSN_CD,ENUM_CM_POSN.POSN_CD)  else LAST_CM_POSN.POSN_CD end   LastFieldPositionCode,
		case when CM_ASGN_ALLOC.ALLOC_TO_IND = 'O' then isnull(LAST_CM_STF_PROF.STF_NO_GHS,ENUM_CM_STF_PROF.STF_NO_GHS)  else LAST_CM_STF_PROF.STF_NO_GHS end LastFieldOfficerCode,
		case when CM_ASGN_ALLOC.ALLOC_TO_IND = 'O' then isnull(LAST_CM_STF_PROF.NAME_ENG,ENUM_CM_STF_PROF.NAME_ENG)  else LAST_CM_STF_PROF.NAME_ENG end LastFieldOfficerName
	INTO #cteLastASGN_ALLOCSummary
	FROM #assignments asgn
	INNER JOIN cteASGN_HIST cteASGN_HIST ON cteASGN_HIST.ASGN_UID = asgn.ASGN_UID
	inner JOIN CENSUS.CM_ASGN_ALLOC (NOLOCK) ON CM_ASGN_ALLOC.ASGN_UID=cteASGN_HIST.ASGN_UID
	LEFT JOIN Census.CM_POSN LAST_CM_POSN (NOLOCK) ON LAST_CM_POSN.POSN_UID = cteASGN_HIST.POSN_UID
	LEFT JOIN Census.CM_ORG_UNIT LAST_CM_ORG_UNIT (NOLOCK) ON LAST_CM_ORG_UNIT.OU_UID = LAST_CM_POSN.OU_UID
	LEFT JOIN [Census].[VW_CM_GET_CURR_STF_POSN] LAST_CM_STF_POSN (NOLOCK) ON LAST_CM_STF_POSN.POSN_UID = LAST_CM_POSN.POSN_UID AND LAST_CM_STF_POSN.STS = 'A'			
	LEFT JOIN Census.CM_STF_PROF LAST_CM_STF_PROF (NOLOCK) ON LAST_CM_STF_PROF.STF_UID = LAST_CM_STF_POSN.STF_UID

	LEFT JOIN Census.CM_POSN ENUM_CM_POSN (NOLOCK) ON ENUM_CM_POSN.POSN_UID = CM_ASGN_ALLOC.POSN_UID_ENUM
	LEFT JOIN Census.CM_ORG_UNIT ENUM_CM_ORG_UNIT (NOLOCK) ON ENUM_CM_ORG_UNIT.OU_UID = ENUM_CM_POSN.OU_UID
	LEFT JOIN [Census].[VW_CM_GET_CURR_STF_POSN] ENUMCM_STF_POSN (NOLOCK) ON ENUM_CM_POSN.POSN_UID = ENUMCM_STF_POSN.POSN_UID AND ENUMCM_STF_POSN.STS = 'A'			
	LEFT JOIN Census.CM_STF_PROF ENUM_CM_STF_PROF (NOLOCK) ON ENUM_CM_STF_PROF.STF_UID = ENUMCM_STF_POSN.STF_UID
	WHERE RowNum=1

	CREATE NONCLUSTERED INDEX ix_cteLastASGN_ALLOCSummary ON #cteLastASGN_ALLOCSummary ([ASGN_UID]);

	SET @pOfficerJson = (
		SELECT 
			stfProf.[STF_UID],
			posn.[POSN_CD],
			posn.[NAME_ENG] [POSN_NAME_ENG],
			posn.[POSN_UID],
			CASE WHEN stfProf.STF_UID IS NULL THEN '' ELSE stfProf.[NAME_ENG] END AS [NAME_ENG],
			CASE WHEN stfProf.STF_UID IS NULL THEN '' ELSE stfProf.[NAME_CHI] END AS [NAME_CHI],
			stfProf.[GNDR],
			stfProf.[OMP_NO],
			stfProf.[GOV_ID],
			stfProf.[STF_NO],
			rnk.[RNK_CD],
			stfProf.[MOB_NO],
			stfProf.[OFFC_TEL_NO],
			poolOrgUnit.[NAME_ENG] [POOL_OU_CD],
			poolOrgUnit.[NAME_ENG] [POOL_OU_NAME_ENG],
			orgUnit.[OU_CD] [TEAM_OU_CD],
			orgUnit.[NAME_ENG] [TEAM_NAME_ENG],
			stfPosn.[STF_POSN_UID],
			asgn.[ASGN_UID],
			cteLastASGN_ALLOCSummary.LastFieldTeam [LST_OU_NAME_ENG],
			cteLastASGN_ALLOCSummary.LastFieldPositionCode [LST_POSN_CD],
			cteLastASGN_ALLOCSummary.LastFieldOfficerCode [LST_STF_NO_GHS],
			cteLastASGN_ALLOCSummary.LastFieldOfficerName [LST_NAME_ENG],
			alloc.[ALLOC_TO_IND]
		FROM #assignments asgn
		INNER JOIN Census.CM_SC sc ON sc.SC_UID = asgn.SC_UID
		LEFT JOIN [Census].[CM_ASGN_ALLOC] alloc (NOLOCK) ON asgn.[ASGN_UID]	= alloc.[ASGN_UID]
		LEFT JOIN [Census].[CM_POSN] posn        (NOLOCK) ON (posn.POSN_UID = alloc.POSN_UID_ENUM and alloc.ALLOC_TO_IND='E') OR (posn.POSN_UID = alloc.POSN_UID_OQ and alloc.ALLOC_TO_IND='O')
		OUTER APPLY 
		(
			SELECT TOP(1) stfPosn.STF_POSN_UID, stfPosn.STF_UID, stfPosn.STRT_DT, stfPosn.END_DT 
			FROM Census.CM_STF_POSN stfPosn WITH(NOLOCK) 
			WHERE stfPosn.POSN_UID = posn.POSN_UID
			AND IIF(stfPosn.END_DT IS NULL, 'Y', IIF(sc.SC_STRT_DT <= stfPosn.END_DT, 'Y', 'N')) = 'Y'
			AND IIF(sc.SC_END_DT IS NULL, 'Y', IIF(stfPosn.STRT_DT<= sc.SC_END_DT, 'Y', 'N')) = 'Y'
			ORDER BY stfPosn.STRT_DT DESC
		) stfPosn
		LEFT JOIN [Census].[CM_STF_PROF] stfProf ON stfProf.STF_UID = stfPosn.STF_UID
		LEFT JOIN [Census].[CM_ORG_UNIT] orgUnit				(NOLOCK) ON orgUnit.[OU_UID]			= posn.[OU_UID]
		LEFT JOIN [Census].[CM_RNK]	rnk							(NOLOCK) ON rnk.[RNK_UID]				= posn.[RNK_UID]
		LEFT JOIN [Census].[CM_ORG_UNIT] poolOrgUnit			(NOLOCK) ON poolOrgUnit.[OU_UID]		= orgUnit.[PAR_OU_UID]
		LEFT JOIN #cteLastASGN_ALLOCSummary cteLastASGN_ALLOCSummary  on cteLastASGN_ALLOCSummary.ASGN_UID = alloc.ASGN_UID
		for json PATH
	)
	--Assignment Remarks
	SET @pRemarkJson = (
		SELECT rmks.[ASGN_RMKS_UID]
			,rmks.[GUID]
			,rmks.[RMKS_CATG]
			,rmksCatgCd.[LBL_ENG] [RMKS_CATG_DESCR]
			,rmks.[ASGN_RMKS]
			,stfprof.[NAME_ENG]
			,stfprof.[NAME_CHI]
			,stfprof.[GOV_ID]
			,rmks.[CRE_DT]
			,stfprof.[NAME_ENG] [CRE_BY]
			,rmks.[UPD_DT]
			,stfprof2.[NAME_ENG] [UPD_BY]
			,rmks.[ASGN_UID]
		FROM #assignments asgnLst
		INNER JOIN [Census].[CM_ASGN_RMKS] (NOLOCK) rmks ON rmks.[ASGN_UID] = asgnLst.[ASGN_UID] AND rmks.[STS] = 'A'
		LEFT JOIN [Census].[VW_CM_GET_CURR_STF_POSN] stfposn ON stfposn.[STF_POSN_UID]   = rmks.[CRE_BY_STF_POSN_UID]
		LEFT JOIN [Census].[VW_CM_GET_CURR_STF_POSN] stfposn2 ON stfposn2.[STF_POSN_UID]   = rmks.[UPD_BY_STF_POSN_UID]
		LEFT JOIN [Census].[CM_STF_PROF] (NOLOCK) stfprof ON stfposn.[STF_UID]		 = stfprof.[STF_UID]
		LEFT JOIN [Census].[CM_STF_PROF] (NOLOCK) stfprof2 ON stfposn2.[STF_UID]		 = stfprof2.[STF_UID]
		LEFT JOIN [Census].[CM_CD_TBL_DTL] (NOLOCK) rmksCatgCd ON rmksCatgCd.[CD_TYP] = @RmksCatgStr AND rmksCatgCd.[CD_VAL] = rmks.[RMKS_CATG]
		for json PATH
	)

	--Supervisor List in the same field team
	if (@pPageSize = 1000 or @pAssignmentGuid IS NOT NULL) -- retrieve when offline mode or details page
	BEGIN
		SET @pSupervisorJson = (
			SELECT sup.[STF_UID],
				stfProf.[GOV_ID],
				posn.[POSN_CD] [SUPV_POSN_CD],
				sup.[POSN_UID] [SUPV_POSN_UID],
				stfProf.[NAME_ENG] [SUPV_NAME_ENG],
				stfProf.[NAME_CHI] [SUPV_NAME_CHI],
				parOu.[NAME_ENG] [FIELD_POOL],
				ou.[NAME_ENG] [FIELD_TEAM],
				rnk.[RNK_CD] [RNK_CD],
				stfProf.[OFFC_TEL_NO] [SUPV_TEL],
				stfProf.[MOB_NO] [SUPV_MOB_NO],
				stfProf.[OMP_NO] [SUPV_OMP_NO],
				sup.[STF_POSN_UID],
				asgn.[ASGN_UID]
			FROM #assignments asgn
			INNER JOIN Census.CM_SC sc (NOLOCK) ON sc.SC_UID = asgn.SC_UID
			LEFT JOIN [Census].[CM_ASGN_ALLOC] alloc (NOLOCK) ON asgn.[ASGN_UID]	= alloc.[ASGN_UID]
			LEFT JOIN [Census].[CM_POSN] posn        (NOLOCK) ON (posn.POSN_UID = alloc.POSN_UID_ENUM and alloc.ALLOC_TO_IND='E') OR (posn.POSN_UID = alloc.POSN_UID_OQ and alloc.ALLOC_TO_IND='O')
			INNER JOIN Census.VW_CM_GET_CURR_STF_POSN (NOLOCK) sup ON sup.POSN_UID = posn.DIR_SUP_POSN_UID and sup.STS = 'A'
			INNER JOIN [Census].[CM_STF_PROF] (NOLOCK) stfProf		ON stfProf.[STF_UID]	 = sup.[STF_UID]
			INNER JOIN [Census].[CM_RNK] (NOLOCK) rnk			ON rnk.RNK_UID = (SELECT RNK_UID FROM [Census].[CM_POSN] WHERE POSN_UID = posn.DIR_SUP_POSN_UID)
			INNER JOIN [Census].[CM_ORG_UNIT] (NOLOCK) ou        ON ou.OU_UID = (SELECT OU_UID FROM [Census].[CM_POSN] WHERE POSN_UID = posn.DIR_SUP_POSN_UID)
			INNER JOIN [Census].[CM_ORG_UNIT] (NOLOCK) parOu        ON parOu.OU_UID = ou.PAR_OU_UID
			group by sup.[STF_UID],
				stfProf.[GOV_ID],
				posn.[POSN_CD],
				sup.[POSN_UID],
				stfProf.[NAME_ENG],
				stfProf.[NAME_CHI],
				parOu.[NAME_ENG],
				ou.[NAME_ENG],
				rnk.[RNK_CD],
				stfProf.[OFFC_TEL_NO],
				stfProf.[MOB_NO],
				stfProf.[OMP_NO],
				sup.[STF_POSN_UID],
				asgn.[ASGN_UID]
			FOR JSON PATH
		)
	END

	SELECT
	--left(asgn.ASGN_REF_NO,6) [REF_NO],
	MAX(CAST(attNo.FLD_VAL AS INT))[MAX_ATT],
	MAX(CAST(hhNo.FLD_VAL AS INT))[MAX_HH],
	asgn.ASGN_UID
	INTO #maxHHandATT
	FROM #assignments viewAsgn
	INNER JOIN  Census.CM_ASGN_MAIN asgn (NOLOCK) ON asgn.ASGN_UID = viewAsgn.ASGN_UID
	LEFT JOIN Census.CM_ASGN_REF_NO sameRefAsgn (NOLOCK) ON LEFT(sameRefAsgn.FLD_VAL, 5) = SUBSTRING(asgn.ASGN_REF_NO, 3, 5) AND sameRefAsgn.FLD_ID = 'REFNO'
	LEFT JOIN Census.CM_ASGN_MAIN sameAsgn (NOLOCK) ON asgn.SC_UID = sameAsgn.SC_UID AND sameAsgn.ASGN_UID = sameRefAsgn.ASGN_UID
	LEFT JOIN Census.CM_ASGN_REF_NO attNo (NOLOCK) ON attNo.FLD_ID = 'ATT' AND sameRefAsgn.ASGN_UID = attNo.ASGN_UID 
	LEFT JOIN Census.CM_ASGN_REF_NO hhNo (NOLOCK) ON hhNo.FLD_ID = 'HH' AND sameRefAsgn.ASGN_UID = hhNo.ASGN_UID 
	GROUP BY
	--RefAsgn.FLD_VAL,
	--left(asgn.ASGN_REF_NO,6),
	asgn.ASGN_UID

	CREATE NONCLUSTERED INDEX ix_maxHHandATT ON #maxHHandATT (ASGN_UID);

	--GET Assignmnet Detail to Json
	SET @pAssignmentDetailJson = (
	
		SELECT asgn.[ASGN_STS]
				,asgn.[NEW_ASGN_TYP] [ASGN_TYP]
				,asgn.[CASE_TYP] -- add for 26C
				,asgn.[WRG_ADDR_IND] -- add for 26C
				,asgn.[CONF_MO_HH_IND] -- add for 26C
				,asgn.[REQ_HH_LTR_IND] -- add for 26C
				,asgn.[SKP_RMDR_IND] -- add for 26C
				,asgn.[COND_SRCH_IND] -- add for 26C
				,asgn.[SP_CASE_IND] -- add for 26C
				,RefDcca.[DCCA_ENG]
				,RefDcca.[DCCA_CHI]
				,qtr.[QTR_TYP]
				,qtr.[TTL_SDU] [SDU] 
				,bldg.[SEG_IND] [SER]
				,qtr.[SRCH_IND]
				,SrchIndCd.[LBL_ENG] [SRCH_IND_DESCR]
				,qtr.[SPLT_IND]
				,cast(qtr.[MERG_IND] as varchar(10)) as [MERG] 
				,cast(qtr.[LQ_SERL] as varchar(10)) as [LQ_SERL]
				,bldg.[TPU]
				,bldg.[BLDG_SERL]
				,bldg.[SB]
				,qtr.[VAC_PLOT_IND]
				,asgn.[CRE_DT]
				,asgn.[DC_RTN_MDE]
				,asgn.[ASGN_UID]
				,vstRtnMde.[EM_DESCR] [DC_RTN_MDE_DESCR]
				,CAST('' AS NVARCHAR(MAX)) [OfficerList]
				,CAST('' AS NVARCHAR(MAX)) [RemarkList]
				,CAST('' AS NVARCHAR(MAX)) [SupervisorList]
				,CASE 
					WHEN asgnRmks.[ASGN_RMKS] IS NOT NULL AND asgnRmks.[ASGN_RMKS] <> '' THEN 'Y' 
					ELSE 'N'
				 END AS [LST_RND_RMKS_IND]
				,HhAndAtt.MAX_ATT
				,HhAndAtt.MAX_HH
   		FROM #assignments asgn
		INNER JOIN [Census].[CM_QTR] (NOLOCK)	qtr			 ON qtr.[QTR_UID]	= asgn.[QTR_UID]
		LEFT JOIN [Census].[CM_QTR_ADDR] (NOLOCK) qtrAddr ON qtr.[QTR_UID] = qtrAddr.[QTR_UID]
		LEFT JOIN [Census].[CM_BLDG_ADDR] (NOLOCK) bldgAddr ON qtrAddr.[BLDG_ADDR_UID] = bldgAddr .[BLDG_ADDR_UID]
		LEFT JOIN [Census].[CM_BLDG] (NOLOCK) bldg			 ON bldgAddr.[BLDG_UID]				= bldg.[BLDG_UID]
		LEFT JOIN [Census].[CM_REF_DCCA] (NOLOCK) RefDcca	 ON RefDcca.[CA]				= bldg.[CA] AND RefDcca.[DC] = bldg.[DC]
		LEFT JOIN [Census].[CM_CD_TBL_DTL] (NOLOCK) SrchIndCd ON SrchIndCd.[CD_TYP]			= @SrchIndStr AND SrchIndCd.[CD_VAL] = qtr.[SRCH_IND] AND SrchIndCd.[STS] = 'A'
		LEFT JOIN [Census].[CM_REF_ENUM_MDE] (NOLOCK) vstRtnMde ON vstRtnMde.[EM_CD]		= asgn.[DC_RTN_MDE] AND vstRtnMde.[STS] = 'A'
		LEFT JOIN [Census].[CM_ASGN_RMKS] (NOLOCK) asgnRmks ON asgnRmks.[ASGN_UID]			= asgn.[PREV_ASGN_UID] AND asgnRmks.[STS] = 'A'
		INNER JOIN #maxHHandATT HhAndAtt ON HhAndAtt.ASGN_UID = asgn.ASGN_UID
		FOR JSON PATH
	) 

	--Interview Log Image
	if (@pPageSize = 1000 or @pAssignmentGuid IS NOT NULL) -- retrieve when offline mode or details page
	BEGIN
		SET @pInterviewLogImageJson = (
			SELECT intvLogPht.[GUID]
				,intvLogPht.[FILE_NAME]
				,intvLogPht.[FILE_PATH]
				,intvLogPht.[FILE_DESCR]
				,intvLog.[INTV_LOG_UID]
				,intvLog.[GUID] [INTV_LOG_GUID]
			FROM #assignments asgnLst
			INNER JOIN [Census].[CM_INTV_LOG] (NOLOCK) intvLog ON intvLog.[ASGN_UID] = asgnLst.[ASGN_UID]
			INNER JOIN [Census].[CM_INTV_LOG_PHT] intvLogPht (NOLOCK) ON intvLogPht.[INTV_LOG_UID] = intvLog.[INTV_LOG_UID] AND intvLogPht.[STS] = 'A'
			WHERE asgnLst.[DL_ASGN] = 1 OR @pAssignmentGuid IS NOT NULL
			FOR JSON PATH
		)
	END

	--GET Interview Log List to Json
	if (@pPageSize = 1000 or @pAssignmentGuid IS NOT NULL) -- retrieve when offline mode or details page
	BEGIN
		SET @pInterviewLogJson = (
			SELECT intvLog.[INTV_LOG_UID]
				,intvLog.[GUID]
				,asgnHhCont.[HH_CONT_UID]
				,asgnHhCont.[GUID] [HH_CONT_GUID]
				,intvLog.[RFS_INTVE_INFO]
				,rfsIntvInfoCd.[LBL_ENG] [RFS_INTVE_INFO_DESCR]
				,intvLog.[SUBM_DT]
				,intvLog.[STRT_DT]
				,intvLog.[STRT_DT_SYS]
				,intvLog.[END_DT]
				,intvLog.[END_DT_SYS]
				,intvLog.[STF_UID]
				,intvLog.[STF_NO]
				,intvLog.[STF_NAME_ENG]
				,intvLog.[STF_NAME_CHI]
				,intvLog.[INTV_SESS]
				,intvLog.[INTV_MDE]
				,intvLog.[ENUM_RSLT_CD] [RSLT]
				,intvLog.[INTV_RMKS]
				,intvLog.[FU_IND]
				,intvLog.[Q_DATA_VER_NO]
				,intvLog.[VST_RSLT_CD]
				,vstRsltCd.[RSLT_DESCR] [VST_RSLT_CD_DESCR]
				,intvLog.[VST_RSLT_RMKS]
				,intvLog.[ENUM_RSLT_CD]
				,enumRsltCd.[RSLT_DESCR] [ENUM_RSLT_CD_DESCR]
				,intvLog.[ENUM_RSLT_RMKS]
				,intvLog.[TI_FAIL_RSN_CD]
				,tiFailRsn.[RSN_DESCR] [TI_FAIL_RSN_CD_DESCR]
				,CAST('' AS NVARCHAR(MAX)) [PHT_LST]
				,intvLog.[CRE_DT]
				,creStfProf.[NAME_ENG] [CRE_BY_NAME_ENG]
				,creStfProf.[NAME_CHI] [CRE_BY_NAME_CHI]
				,intvLog.[UPD_DT]
				,updStfProf.[NAME_ENG] [UPD_BY_NAME_ENG]
				,updStfProf.[NAME_CHI] [UPD_BY_NAME_CHI]
				,intvLog.[ASGN_UID]
				,CASE 
					WHEN tmLogDtl.STS ='A'
						THEN 'Y'
					WHEN orgUnit.AUTO_TM_LOG_IND = 'Y'
							THEN 'X'
					ELSE 'N' 
				END AS INSERTED_TIME_LOG_STS --CHECK 
				,tmLogDtl.TM_LOG_DTL_UID
				,intvLog.POSN_CD AS CRE_BY_POSN_CD
			FROM #assignments asgnLst
			INNER JOIN [Census].[CM_INTV_LOG] intvLog (NOLOCK) ON intvLog.[ASGN_UID] = asgnLst.[ASGN_UID] AND (intvLog.[INTV_STS] <> 'D' OR intvLog.[INTV_STS] IS NULL)
			--INNER JOIN [Census].[CM_ASGN_MAIN] (NOLOCK) asgn ON asgn.[ASGN_UID] = asgnLst.[ASGN_UID] OR (ISNULL(asgn.[MAIN_ASGN_UID], 0) = asgnLst.[ASGN_UID] AND ISNULL(asgn.[NEW_ASGN_TYP], '') = 'SUB')
			INNER JOIN [Census].[CM_SC] (NOLOCK) sc ON asgnLst.[SC_UID] = sc.[SC_UID]
			LEFT  JOIN [Census].[CM_REF_TI_FAIL_RSN] (NOLOCK) tiFailRsn ON tiFailRsn.[RSN_CD]		= intvLog.[TI_FAIL_RSN_CD] AND tiFailRsn.[STS] = 'A'
			LEFT  JOIN [Census].[CM_ASGN_HH_CONT] (NOLOCK) asgnHhCont ON asgnHhCont.[HH_CONT_UID] = intvLog.[HH_CONT_UID] AND asgnHhCont.[STS] = 'A'
			LEFT  JOIN [Census].[CM_SRVY_ENUM_RSLT] (NOLOCK) vstRsltCd	ON vstRsltCd.[RSLT_CD]	= intvLog.[VST_RSLT_CD] AND vstRsltCd.[SRVY_UID] = sc.[SRVY_UID] AND vstRsltCd.[STS] = 'A'
			LEFT  JOIN [Census].[CM_SRVY_ENUM_RSLT] (NOLOCK) enumRsltCd ON enumRsltCd.[RSLT_CD] = intvLog.[ENUM_RSLT_CD] AND enumRsltCd.[SRVY_UID] = sc.[SRVY_UID] AND enumRsltCd.[STS] = 'A'
			LEFT  JOIN [Census].[CM_CD_TBL_DTL] (NOLOCK) rfsIntvInfoCd ON rfsIntvInfoCd.[CD_TYP] = @RfsIntvInfoStr AND rfsIntvInfoCd.[CD_VAL] = intvLog.[RFS_INTVE_INFO] AND rfsIntvInfoCd.[STS] = 'A'
			LEFT  JOIN [Census].[VW_CM_GET_CURR_STF_POSN] creStfPosn ON creStfPosn.[STF_POSN_UID] = intvLog.[CRE_BY_STF_POSN_UID]
			LEFT  JOIN [Census].[CM_STF_PROF] (NOLOCK) creStfProf ON creStfProf.[STF_UID] = creStfPosn.[STF_UID]
			LEFT  JOIN [Census].[VW_CM_GET_CURR_STF_POSN] updStfPosn ON updStfPosn.[STF_POSN_UID] = intvLog.[UPD_BY_STF_POSN_UID]
			LEFT  JOIN [Census].[CM_STF_PROF] (NOLOCK) updStfProf ON updStfProf.[STF_UID] = updStfPosn.[STF_UID]
			LEFT  JOIN [Census].[CM_TM_LOG_DTL] (NOLOCK) tmLogDtl ON tmLogDtl.[INTV_LOG_UID] = intvLog.[INTV_LOG_UID]
			LEFT  JOIN [Census].[CM_STF_POSN] (NOLOCK) stfPosn ON stfPosn.[STF_POSN_UID] = intvLog.[CRE_BY_STF_POSN_UID]
			LEFT  JOIN [Census].[CM_POSN] (NOLOCK) posn ON posn.[POSN_UID] = stfPosn.[POSN_UID]
			LEFT  JOIN [Census].[CM_ORG_UNIT] (NOLOCK) orgUnit ON orgUnit.[OU_UID] =  posn.[OU_UID]
			WHERE asgnLst.[DL_ASGN] = 1 OR @pAssignmentGuid IS NOT NULL
			for json PATH
		)
	END

	--GET Appointment Booking to Json
	SET @pAppointmentJson = (
		SELECT appt.[APPT_UID],
			appt.[ASGN_UID],
			appt.[GUID],
			appt.[INTV_MDE],
			appt.[REQ_CONT_IND],
			intvMdeCd.[LBL_ENG] [INTV_MDE_DESCR],
			asgnHhCont.[HH_CONT_UID],
			asgnHhCont.[GUID] [HH_CONT_GUID],
			appt.[APPT_DT_NEW],
			DATEADD(HOUR, DATEPART(HOUR, appt.APPT_DT_STRT), 
				DATEADD(MINUTE, DATEPART(MINUTE, appt.APPT_DT_STRT), 
				DATEADD(SECOND, DATEPART(SECOND, appt.APPT_DT_STRT), 
				CAST(CAST(appt.APPT_DT_NEW AS DATE) AS DATETIME)))) [APPT_DT_STRT],
			DATEADD(HOUR, DATEPART(HOUR, appt.APPT_DT_END), 
                DATEADD(MINUTE, DATEPART(MINUTE, appt.APPT_DT_END), 
                DATEADD(SECOND, DATEPART(SECOND, appt.APPT_DT_END), 
				CAST(CAST(appt.APPT_DT_NEW AS DATE) AS DATETIME)))) [APPT_DT_END],
			appt.[APPT_STS],
			apptStsCd.[LBL_ENG] [APPT_STS_DESCR],
			appt.[APPT_BOOK_INIT],
			appt.[APPT_CXL_INIT],
			appt.[APPT_CXL_RSN_CD],
			apptCanRsnCd.[LBL_ENG] [APPT_CXL_RSN_CD_DESCR],
			appt.[APPT_CXL_RSN_OTH],
			appt.[APPT_CXL_DT],
			appt.[APPT_CXL_POSN_UID],
			appt.[APPT_CXL_STF_UID],
			appt.[APPT_CXL_POSN_CD],
			appt.[APPT_CXL_POSN_NAME_ENG],
			appt.[APPT_CXL_POSN_NAME_CHI],
			appt.[APPT_CXL_STF_NO],
			appt.[APPT_CXL_STF_NAME_ENG],
			appt.[APPT_CXL_STF_NAME_CHI],
			appt.[APPT_RMKS],
			appt.[CRE_DT],
			creStfProf.[NAME_ENG] [CRE_BY_NAME_ENG],
			creStfProf.[NAME_CHI] [CRE_BY_NAME_CHI],
			appt.[UPD_DT],
			updStfProf.[NAME_ENG] [UPD_BY_NAME_ENG],
			updStfProf.[NAME_CHI] [UPD_BY_NAME_CHI],
			appt.[STF_UID],
			appt.[STF_NO]
		FROM #assignments asgnLst
		INNER JOIN [Census].[CM_APPT] (NOLOCK) appt ON appt.[ASGN_UID] = asgnLst.[ASGN_UID] AND appt.[APPT_STS] <> 'D'
		--INNER JOIN [Census].[CM_ASGN_MAIN] (NOLOCK) asgn ON asgn.[ASGN_UID] = asgnLst.[ASGN_UID] OR (ISNULL(asgn.[MAIN_ASGN_UID], 0) = asgnLst.[ASGN_UID] AND ISNULL(asgn.[NEW_ASGN_TYP], '') = 'SUB')
		LEFT JOIN [Census].[CM_ASGN_HH_CONT] (NOLOCK) asgnHhCont ON asgnHhCont.[HH_CONT_UID] = appt.[HH_CONT_UID]
		LEFT JOIN [Census].[CM_CD_TBL_DTL] (NOLOCK) intvMdeCd    ON intvMdeCd.[CD_TYP]	   = @IntvMdeStr     AND intvMdeCd.[CD_VAL]    = appt.[INTV_MDE] AND intvMdeCd.[STS] = 'A'
		LEFT JOIN [Census].[CM_CD_TBL_DTL] (NOLOCK) apptCanRsnCd ON apptCanRsnCd.[CD_TYP] = @ApptCanRsnStr  AND apptCanRsnCd.[CD_VAL] = appt.[APPT_CXL_RSN_CD] AND apptCanRsnCd.[STS] = 'A'
		LEFT JOIN [Census].[CM_CD_TBL_DTL] (NOLOCK) apptStsCd	  ON apptStsCd.[CD_TYP]    = @ApptStsStr     AND apptStsCd.[CD_VAL]    = appt.[APPT_STS] AND apptStsCd.[STS] = 'A'
		LEFT  JOIN [Census].[VW_CM_GET_CURR_STF_POSN] (NOLOCK) creStfPosn ON creStfPosn.[STF_POSN_UID] = appt.[CRE_BY_STF_POSN_UID]
		LEFT  JOIN [Census].[CM_STF_PROF] (NOLOCK) creStfProf ON creStfProf.[STF_UID] = creStfPosn.[STF_UID]
		LEFT  JOIN [Census].[VW_CM_GET_CURR_STF_POSN] (NOLOCK) updStfPosn ON updStfPosn.[STF_POSN_UID] = appt.[UPD_BY_STF_POSN_UID]
		LEFT  JOIN [Census].[CM_STF_PROF] (NOLOCK) updStfProf ON updStfProf.[STF_UID] = updStfPosn.[STF_UID]
		WHERE asgnLst.[DL_ASGN] = 1 OR @pAssignmentGuid IS NOT NULL
		AND (@pAssignmentGuid IS NOT NULL OR ISNULL(creStfProf.[STF_UID], 0) = @sStfUid)
		for json path
	)

	--GET Contact List to Json
	if (@pPageSize = 1000 or @pAssignmentGuid IS NOT NULL) -- retrieve when offline mode or details page
	BEGIN
		SET @pContactJson = (
			SELECT asgnHhCont.[SEQ_NO],
					asgnHhCont.[GUID],
					asgnHhCont.[ASGN_UID]
			FROM #assignments asgnLst
			INNER JOIN [Census].[CM_ASGN_HH_CONT] (NOLOCK) asgnHhCont ON asgnHhCont.[ASGN_UID] = asgnLst.[ASGN_UID]
			INNER JOIN [Census].[CM_ASGN_MAIN] (NOLOCK) asgn ON asgn.[ASGN_UID] = asgnLst.[ASGN_UID] OR (ISNULL(asgn.[MAIN_ASGN_UID], 0) = asgnLst.[ASGN_UID] AND ISNULL(asgn.[NEW_ASGN_TYP], '') = 'SUB')
			WHERE asgnLst.[DL_ASGN] = 1 OR @pAssignmentGuid IS NOT NULL
			for json path
		)
	END
	
	--GET Enquiry Log to Json
	if (@pPageSize = 1000 or @pAssignmentGuid IS NOT NULL) -- retrieve when offline mode or details page
	BEGIN
		SET @pEnquiryLogJson = (
			SELECT enqLog.[CASE_LOG_UID] [CASE_LOG_UID]
				,enqLog.[GUID]
				,asgnLst.[ASGN_UID]
			FROM #assignments asgnLst
			INNER JOIN [Census].[CM_ENQ_LOG_ASGN] (NOLOCK) enqLogAsgn ON enqLogasgn.[ASGN_UID] = asgnLst.[ASGN_UID] 
			INNER JOIN [Census].[CM_ASGN_MAIN] (NOLOCK) asgn ON asgn.[ASGN_UID] = asgnLst.[ASGN_UID] OR (ISNULL(asgn.[MAIN_ASGN_UID], 0) = asgnLst.[ASGN_UID] AND ISNULL(asgn.[NEW_ASGN_TYP], '') = 'SUB')
			INNER JOIN [Census].[CM_ENQ_LOG] (NOLOCK) enqLog	ON enqLog.[CASE_LOG_UID]	= enqLogAsgn.[CASE_LOG_UID]
			WHERE asgnLst.[DL_ASGN] = 1 OR @pAssignmentGuid IS NOT NULL
			for json path
		) 
	END

	--GET Itinerary Plan List to Json
	SET @pItineraryPlanJson = (
		SELECT itinPlnItm.[IPLN_ITM_UID]
			,itinPlnItm.[GUID]
			,itinPlnItm.[IPLN_UID]
			,itinPln.[GUID] [IPLN_GUID]
			,itinPlnItm.[IPLN_GRP_UID]
			,itinPlnGrp.[GUID] [IPLN_GRP_GUID]
			,itinPln.[IPLN_DT]
			,itinPlnSeq.[IPLN_SEQ_UID]
			,itinPlnSeq.[GUID] [IPLN_SEQ_GUID]
			,itinPln.[IPLN_STS]
			,asgn.[ASGN_UID]
		FROM #assignments asgn
		INNER JOIN [Census].[CM_ITIN_PLN_ITM] (NOLOCK) itinPlnItm ON itinPlnItm.[ASGN_UID] = asgn.[ASGN_UID] AND itinPlnItm.[STS] = 'A'
		INNER JOIN [Census].[CM_ITIN_PLN] (NOLOCK)	  itinPln	 ON itinPln.[IPLN_UID]		  = itinPlnItm.[IPLN_UID] AND itinPln.[STF_UID] = @sStfUid
		LEFT  JOIN [Census].[CM_ITIN_PLN_GRP] (NOLOCK) itinPlnGrp ON itinPlnGrp.[IPLN_GRP_UID] = itinPlnItm.[IPLN_GRP_UID]
		LEFT  JOIN [Census].[CM_ITIN_PLN_SEQ] (NOLOCK) itinPlnSeq ON itinPlnSeq.[IPLN_ITM_UID] = itinPlnItm.[IPLN_ITM_UID] AND itinPlnSeq.[IPLN_UID] = itinPlnItm.[IPLN_UID]
		for json path
	)

	if (@pPageSize = 1000 or @pAssignmentGuid IS NOT NULL) -- retrieve when offline mode or details page
	BEGIN
		SET @pActivtiyJson = (
			SELECT asgnActy.[ASGN_ACTY_UID]
				,asgnActy.[ACTY_UID]
				,refAsgnActy.[ACTY_TYP]
				,refAsgnActy.[DESCR_ENG] [ACTY_TYP_DESCR_ENG]
				,asgnActy.[OTH_DESCR]
				,asgnActy.[CRE_DT]
				,stfProf.[NAME_ENG] [CRE_BY_NAME_ENG]
				,stfProf.[NAME_CHI] [CRE_BY_NAME_CHI]
				,asgnActy.[ASGN_UID]
			FROM #assignments asgnLst
			INNER JOIN [Census].[CM_ASGN_ACTY] (NOLOCK) asgnActy ON asgnActy.[ASGN_UID] = asgnLst.[ASGN_UID]
			INNER JOIN [Census].[CM_REF_ASGN_ACTY] (NOLOCK) refAsgnActy	ON refAsgnActy.[ACTY_UID] = asgnActy.[ACTY_UID]
			LEFT  JOIN [Census].[VW_CM_GET_CURR_STF_POSN] selAprvStfPosn	ON selAprvStfPosn.[POSN_UID] = 0 --asgnActy.[SEL_APRV_POSN_UID]
			LEFT  JOIN [Census].[VW_CM_GET_CURR_STF_POSN] aprvStfPosn		ON aprvStfPosn.[POSN_UID] = 0 --asgnActy.[SEL_APRV_POSN_UID]
			LEFT  JOIN [Census].[CM_STF_PROF] (NOLOCK) selAprvStfProf	ON selAprvStfProf.[STF_UID] = selAprvStfPosn.[STF_UID]
			LEFT  JOIN [Census].[CM_STF_PROF] (NOLOCK) aprvStfProf		ON aprvStfProf.[STF_UID] = aprvStfPosn.[STF_UID]
			LEFT  JOIN [Census].[VW_CM_GET_CURR_STF_POSN] stfPosn			ON stfPosn.[STF_POSN_UID] = asgnActy.[CRE_BY_STF_POSN_UID]
			LEFT  JOIN [Census].[CM_STF_PROF] (NOLOCK) stfProf			ON stfProf.[STF_UID] = stfPosn.[STF_UID]
			WHERE asgnActy.[ASGN_UID] = asgnLst.[ASGN_UID]
			ORDER BY asgnActy.[CRE_DT] DESC
			for json path
		)
	END

	SET @pEFieldCardJson = (
		SELECT efc.[EFC_UID]
			,efc.[GUID]
			,asgn.[ASGN_UID]
		FROM #assignments asgn
		INNER JOIN [Census].[CM_EFC_ASGN] (NOLOCK) efcAsgn ON efcAsgn.[ASGN_UID] = asgn.[ASGN_UID]
		INNER JOIN [Census].[CM_EFC] (NOLOCK) efc ON efcAsgn.[EFC_UID] = efc.[EFC_UID]
		for json path
	)


	SELECT asgnAprvReq.[ASGN_UID]
			,MAX(asgnAprvReq.[APRV_REQ_UID]) [APRV_REQ_UID]
	into #AssignmentApprovalRequest
	FROM #assignments asgn
	INNER JOIN [Census].[CM_ASGN_APRV_REQ] (NOLOCK) asgnAprvReq ON asgnAprvReq.[ASGN_UID] = asgn.[ASGN_UID]
	GROUP BY asgnAprvReq.[ASGN_UID]
	CREATE NONCLUSTERED INDEX ix_AssignmentApprovalRequest ON #AssignmentApprovalRequest ([ASGN_UID]);

	SELECT qDataInfo.[ASGN_UID]
			,MAX(qDataInfo.[Q_DATA_VER_NO]) [Q_DATA_VER_NO]
	into #LatestQuestionnaireVersion
	FROM [Census].[CM_Q_DATA_INFO] qDataInfo (NOLOCK)
	INNER JOIN #assignments asgn ON asgn.[ASGN_UID] = qDataInfo.[ASGN_UID]
	GROUP BY qDataInfo.[ASGN_UID]
	CREATE NONCLUSTERED INDEX ix_LatestQuestionnaireVersion ON #LatestQuestionnaireVersion ([ASGN_UID]);
	

	if (@pPageSize = 1000 or @pAssignmentGuid IS NOT NULL) -- retrieve when offline mode or details page
	BEGIN
		SET @pQuestionaireVersionJson = (
			SELECT qDataInfo.[Q_DATA_VER_NO]
					,qDataInfo.[Q_DATA_TYP]
					,refQDataTyp.[DESCR_ENG] [Q_DATA_TYP_DESCR]
					,qDataInfo.[Q_DATA_STS]
					,refQDataSts.[DESCR_ENG] [Q_DATA_STS_DESCR]
					,qDataInfo.[ENUM_MDE]
					,refEnumMde.[EM_DESCR] [ENUM_MDE_DESCR]
					,qDataInfo.[RVW_STS]
					,rvwStsCd.[LBL_ENG] [RVW_STS_DESCR]
					,rvwStfProf.[STF_UID] [RVW_BY_STF_UID]
					,rvwStfProf.[NAME_ENG] [RVW_BY_STF_NAME_ENG]
					,qDataInfo.[RVW_DT]
					,qDataInfo.[DF_STS]
					,dfStsCd.[LBL_ENG] [DF_STS_DESCR]
					,qDataInfo.[CRE_DT]
					,ISNULL(creStfProf.[NAME_ENG], qDataInfo.[CRE_BY_USR_ID]) [CRE_BY]
					,qDataInfo.[UPD_DT]
					,ISNULL(updStfProf.[NAME_ENG], qDataInfo.[UPD_BY_USR_ID]) [UPD_BY]
					,asgnLst.[ASGN_UID]
			FROM #assignments asgnLst
			INNER JOIN [Census].[CM_Q_DATA_INFO] (NOLOCK) qDataInfo ON qDataInfo.[ASGN_UID] = asgnLst.[ASGN_UID]
			INNER JOIN [Census].[CM_SC] (NOLOCK) sc ON sc.[SC_UID] = asgnLst.[SC_UID]
			LEFT JOIN [Census].[CM_REF_Q_DATA_TYP] (NOLOCK) refQDataTyp ON refQDataTyp.[Q_DATA_TYP] = qDataInfo.[Q_DATA_TYP] AND refQDataTyp.[STS] = 'A' AND sc.[SRVY_UID] = refQDataTyp.[SRVY_UID]
			LEFT JOIN [Census].[CM_REF_Q_DATA_STS] (NOLOCK) refQDataSts ON refQDataSts.[Q_DATA_STS] = qDataInfo.[Q_DATA_STS] AND sc.[SRVY_UID] = refQDataSts.[SRVY_UID]
			LEFT JOIN [Census].[CM_REF_ENUM_MDE] (NOLOCK) refEnumMde	   ON refEnumMde.[EM_CD] = qDataInfo.[ENUM_MDE] AND refEnumMde.[STS] = 'A'
			LEFT JOIN [Census].[CM_CD_TBL_DTL] (NOLOCK) rvwStsCd		   ON rvwStsCd.[CD_TYP] = @RvwStsStr AND rvwStsCd.[CD_VAL] = qDataInfo.[RVW_STS] AND rvwStsCd.[STS] = 'A'
			LEFT JOIN [Census].[VW_CM_GET_CURR_STF_POSN] rvwStfPosn		   ON rvwStfPosn.[STF_POSN_UID] = qDataInfo.[RVW_BY_STF_POSN_UID]
			LEFT JOIN [Census].[CM_STF_PROF] (NOLOCK) rvwStfProf		   ON rvwStfProf.[STF_UID] = rvwStfPosn.[STF_UID]
			LEFT JOIN [Census].[CM_CD_TBL_DTL] (NOLOCK) dfStsCd		   ON dfStsCd.[CD_TYP] = @dfStsStr AND dfStsCd.[CD_VAL] = qDataInfo.[DF_STS] AND dfStsCd.[STS] = 'A'
			LEFT JOIN [Census].[CM_STF_POSN] (NOLOCK) creStfPosn		   ON creStfPosn.[STF_POSN_UID] = qDataInfo.[CRE_BY_STF_POSN_UID]
			LEFT JOIN [Census].[CM_STF_PROF] (NOLOCK) creStfProf		   ON creStfProf.[STF_UID] = creStfPosn.[STF_UID]
			LEFT JOIN [Census].[CM_STF_POSN] (NOLOCK) updStfPosn		   ON updStfPosn.[STF_POSN_UID] = qDataInfo.[UPD_BY_STF_POSN_UID]
			LEFT JOIN [Census].[CM_STF_PROF] (NOLOCK) updStfProf		   ON updStfProf.[STF_UID] = updStfPosn.[STF_UID]
			WHERE asgnLst.[DL_ASGN] = 1 OR @pAssignmentGuid IS NOT NULL
			FOR JSON PATH
		) 
	END

	SELECT asgn.[ASGN_UID], appt.[APPT_UID]
	into #latestAppointment
	FROM #assignments asgn
	LEFT JOIN (
		SELECT CM_APPT.ASGN_UID
				,ROW_NUMBER() OVER (PARTITION BY CM_APPT.ASGN_UID ORDER BY DATEADD(HOUR, DATEPART(HOUR, APPT_DT_STRT), -- aligned with FMS
                                                                     DATEADD(MINUTE, DATEPART(MINUTE, APPT_DT_STRT), 
                                                                     DATEADD(SECOND, DATEPART(SECOND, APPT_DT_STRT), 
																	 CAST(APPT_DT_NEW AS DATETIME)))) DESC) AS RowNum
				,CM_APPT.APPT_UID APPT_UID
		FROM Census.CM_APPT CM_APPT WITH (NOLOCK) 
		WHERE CM_APPT.APPT_STS = 'B'
	) AS appt on asgn.[ASGN_UID] = appt.[ASGN_UID] AND appt.RowNum = 1
	order by asgn.[ASGN_UID]

	CREATE NONCLUSTERED INDEX ix_latestAppointment ON #latestAppointment ([ASGN_UID]);

	SELECT asgn.[ASGN_UID], intvLog.[INTV_LOG_UID]
	into #latestInterviewLog
	FROM #assignments asgn
	LEFT JOIN (
		SELECT r.[ASGN_UID], max([INTV_LOG_UID]) as [INTV_LOG_UID]
		FROM (
			  SELECT [ASGN_UID], MAX([STRT_DT]) as STRT_DT
			  FROM [Census].[CM_INTV_LOG] (NOLOCK)
			  WHERE [INTV_STS] = 'A'
			  GROUP BY [ASGN_UID]
		) r
		INNER JOIN [Census].[CM_INTV_LOG] t (NOLOCK)
		ON t.[ASGN_UID] = r.[ASGN_UID] AND t.[STRT_DT] = r.[STRT_DT]
		WHERE t.[INTV_STS] = 'A'
		GROUP BY r.[ASGN_UID]
	) AS intvLog on asgn.[ASGN_UID] = intvLog.[ASGN_UID]
	order by asgn.[ASGN_UID]
	CREATE NONCLUSTERED INDEX ix_latestInterviewLog1 ON #latestInterviewLog ([ASGN_UID]);
	CREATE NONCLUSTERED INDEX ix_latestInterviewLog2 ON #latestInterviewLog ([INTV_LOG_UID]);

	SELECT asgnLst.[ASGN_UID]
	into #SketchMap
	FROM #assignments asgnLst
	INNER JOIN [Census].[CM_EFC_ASGN] (NOLOCK) efcAsgn ON efcAsgn.[ASGN_UID] = asgnLst.[ASGN_UID]
	INNER JOIN [Census].[CM_EFC_FILE] (NOLOCK) efcFile ON efcFile.[EFC_UID] = efcAsgn.[EFC_UID] AND efcFile.[STS] = 'A' AND ISNULL(efcFile.[FILE_TYP], '') IN ('S', 'M')
	GROUP BY asgnLst.[ASGN_UID]

	if (@pPageSize = 1000 or @pAssignmentGuid IS NOT NULL) -- retrieve when offline mode or details page
	BEGIN
		SET @pAdminDataPerFillJson = (
			SELECT qDataPref.[DATA_SRC]
					,qDataPref.[FLD_NAME]
					,qDataPref.[FLD_VAL]
					,qDataPref.[ASGN_UID]
			FROM #assignments asgnLst
			INNER JOIN [Census].[CM_Q_DATA_PREF] qDataPref (NOLOCK) ON qDataPref.[ASGN_UID] = asgnLst.[ASGN_UID]
			WHERE @pAssignmentGuid IS NOT NULL OR asgnLst.[DL_ASGN] = 1
			FOR JSON PATH
		) 
	END

	SELECT
		asgnOqAcct.[ASGN_UID],
		asgnOqAcct.[ACCT_REG_DT] [REG_DT],
		asgnOqAcct.[SUBM_DT]
	into #oqRegDt
	FROM #assignments asgn
	INNER JOIN [Census].[CM_ASGN_OQ_ACCT] asgnOqAcct (NOLOCK) ON asgnOqAcct.ASGN_UID = asgn.ASGN_UID
	CREATE NONCLUSTERED INDEX ix_oqRegDt ON #oqRegDt ([ASGN_UID]);

	--Get child sup-survey
	if (@pPageSize = 1000 or @pAssignmentGuid IS NOT NULL) -- retrieve when offline mode or details page
	BEGIN
		SET @pSubSurveyJson = (
			SELECT subAsgn.[ASGN_UID],
					subAsgn.[GUID],
					tmp.[TMPL_UID],
					tmp.[DOC_REF_NO],
					rawQDataInfo.[TB_NAME] [SUB_TB_NAME],
					rawQDataInfo.[DOC_REF_NO] [SUB_DOC_REF_NO],
					indrQDataInfo.[TB_NAME] [INDR_TB_NAME],
					indrQDataInfo.[DOC_REF_NO] [INDR_DOC_REF_NO],
					fuQDataInfo.[TB_NAME] [FU_TB_NAME],
					fuQDataInfo.[DOC_REF_NO] [FU_DOC_REF_NO],
					fldQDataInfo.[TB_NAME] [FLD_TB_NAME],
					fldQDataInfo.[DOC_REF_NO] [FLD_DOC_REF_NO],
					MAX(qDataInfo.[Q_DATA_VER_NO]) [LST_Q_DATA_VER_NO],
					ISNULL(subAsgn.[QC_SAMP_IND], 'N') [QC_SAMP_IND],
					ISNULL(indrQDataInfo.[REQ_FU_IND], 'N') [REQ_FU_IND],
					asgnLst.[ASGN_UID] [MAIN_ASGN_UID]
			FROM #assignments asgnLst
			INNER JOIN [Census].[CM_ASGN_MAIN] subAsgn (NOLOCK) ON subAsgn.[MAIN_ASGN_UID] = asgnLst.[ASGN_UID] AND subAsgn.[NEW_ASGN_TYP] = 'SUB' AND subAsgn.[ASGN_STG_IND] in ('D', 'PF', 'F')
			LEFT  JOIN [Census].[CM_ASGN_Q_VER] (NOLOCK) asgnQVer ON asgnQVer.[ASGN_UID] = subAsgn.[ASGN_UID]
			LEFT  JOIN [Census].[CM_Q_DATA_INFO] (NOLOCK) rawQDataInfo ON rawQDataInfo.[ASGN_UID] = asgnQVer.[ASGN_UID] AND asgnQVer.[RAW_VER_NO] = rawQDataInfo.[Q_DATA_VER_NO]
			LEFT  JOIN [Census].[CM_Q_DATA_INFO] (NOLOCK) indrQDataInfo ON indrQDataInfo.[ASGN_UID] = asgnQVer.[ASGN_UID] AND asgnQVer.[INDR_VER_NO] = indrQDataInfo.[Q_DATA_VER_NO]
			LEFT  JOIN [Census].[CM_Q_DATA_INFO] (NOLOCK) fuQDataInfo ON fuQDataInfo.[ASGN_UID] = asgnQVer.[ASGN_UID] AND asgnQVer.[FU_QC_VER_NO] = fuQDataInfo.[Q_DATA_VER_NO]
			LEFT  JOIN [Census].[CM_Q_DATA_INFO] (NOLOCK) fldQDataInfo ON fldQDataInfo.[ASGN_UID] = asgnQVer.[ASGN_UID] AND asgnQVer.[FU_QC_VER_NO] = fldQDataInfo.[Q_DATA_VER_NO]
			LEFT  JOIN [Census].[CM_Q_DATA_INFO] (NOLOCK) qDataInfo ON qDataInfo.[ASGN_UID] = subAsgn.[ASGN_UID]
			OUTER APPLY [Census].[FN_GET_Q_TMPL_BY_ASGN_UID_OR_GUID](subAsgn.[ASGN_UID], subAsgn.[GUID]) tmp
			GROUP BY
			subAsgn.[ASGN_UID],
			subAsgn.[GUID],
			tmp.[TMPL_UID],
			tmp.[DOC_REF_NO],
			rawQDataInfo.[TB_NAME],
			rawQDataInfo.[DOC_REF_NO],
			indrQDataInfo.[TB_NAME],
			indrQDataInfo.[DOC_REF_NO],
			fuQDataInfo.[TB_NAME],
			fuQDataInfo.[DOC_REF_NO],
			fldQDataInfo.[TB_NAME],
			fldQDataInfo.[DOC_REF_NO],
			ISNULL(subAsgn.[QC_SAMP_IND], 'N'),
			ISNULL(indrQDataInfo.[REQ_FU_IND], 'N'),
			asgnLst.[ASGN_UID]
			FOR JSON PATH
		)
	END

	if (@pPageSize = 1000 or @pAssignmentGuid IS NOT NULL) -- retrieve when offline mode or details page
	BEGIN
		SET @pQuestionnaireImageJson = (
			SELECT 
					asgnLst.[ASGN_UID],
					asgnLst.[GUID] [ASGN_GUID],
					tmp.[DOC_REF_NO],
					qImg.[FLD_TYP],
					qImg.[FLD_NAME],
					qImg.[RMKS],
					qImg.[PATH_STR]
			FROM #assignments asgnLst
			INNER JOIN Census.CM_ASGN_MAIN reqAsgn ON reqAsgn.ASGN_UID = CASE WHEN (asgnLst.CASE_TYP = 'CC' OR asgnLst.CASE_TYP = 'VU') AND asgnLst.ASGN_STS = 'PE' THEN asgnLst.PREV_ASGN_UID ELSE asgnLst.ASGN_UID END
			LEFT JOIN Census.CM_ASGN_MAIN subAsgn ON subAsgn.MAIN_ASGN_UID = asgnLst.ASGN_UID
			LEFT JOIN Census.CM_ASGN_MAIN respAsgn ON (respAsgn.ASGN_UID = subAsgn.ASGN_UID OR respAsgn.ASGN_UID = reqAsgn.ASGN_UID)
			INNER JOIN [Census].[DC_Q_IMG] (NOLOCK) qImg ON qImg.[ASGN_UID] = respAsgn.[ASGN_UID] OR (asgnLst.[NEW_ASGN_TYP] = 'SUB' AND asgnLst.[ASGN_STS] <> 'DEL' AND asgnLst.[MAIN_ASGN_UID] = asgnLst.[ASGN_UID])
			AND qImg.[STS] = 'A'
			CROSS APPLY [Census].[FN_GET_Q_TMPL_BY_ASGN_UID_OR_GUID](asgnLst.[ASGN_UID], asgnLst.[GUID]) tmp
			WHERE @pAssignmentGuid IS NOT NULL OR asgnLst.[DL_ASGN] = 1
			FOR JSON PATH
		)
	END
	
	SELECT DISTINCT CM_ASGN_ALLOC_HIST.ASGN_UID, CM_ASGN_ALLOC_HIST.POSN_UID
	INTO #VIEW_ASGN_ALLOC_HIST
	FROM [Census].CM_ASGN_ALLOC_HIST (NOLOCK) 
	WHERE ALLOC_TYP IN ('R','T','RFU')
	CREATE NONCLUSTERED INDEX ix_VIEW_ASGN_ALLOC_HIST ON #VIEW_ASGN_ALLOC_HIST ([ASGN_UID]);

	SELECT ASGN_UID, COUNT(1) NUM_OF_RMKS
	into #lastRoundRmks
	FROM Census.CM_ASGN_RMKS (NOLOCK) 
	WHERE STS = 'A'
	GROUP BY ASGN_UID
	CREATE NONCLUSTERED INDEX ix_lastRoundRmks ON #lastRoundRmks ([ASGN_UID]);

	SELECT asgn.[ASGN_UID],asgn.[GUID], qVldVer.[VLD_VER_UID], ROW_NUMBER() OVER (PARTITION BY asgn.[ASGN_UID] ORDER BY qVldVer.[EFF_DT] DESC,[VLD_VER_NO] DESC ) AS ROW_NUM
	INTO #AsgnQ_VLD_VER
	FROM #assignments asgnList
	INNER JOIN Census.CM_ASGN_MAIN asgn ON asgn.ASGN_UID = asgnList.ASGN_UID
	LEFT  JOIN [Census].[CM_SC_SRVY] scSrvy ON scSrvy.[SC_UID] = asgn.[SC_UID]
	LEFT  JOIN [Census].[CM_Q_VLD_VER] qVldVer ON qVldVer.[VLD_VER_UID] = scSrvy.[VLD_VER_UID]

	-- SELECT qTmpl.[TMPL_UID],
		   -- qTmpl.[DOC_REF_NO],
		   -- qVldVer.[VLD_VER_UID],
		   -- result.[ASGN_UID],
		   -- result.[GUID] AS ASGN_GUID
	-- INTO #ASGN_Q_TMPL
	-- FROM #AsgnQ_VLD_VER result
	-- LEFT  JOIN [Census].[CM_Q_VLD_VER] qVldVer ON qVldVer.[VLD_VER_UID] = result.[VLD_VER_UID]
	-- LEFT  JOIN [Census].[CM_Q_TMPL] qTmpl ON qTmpl.[TMPL_UID] = qVldVer.[TMPL_UID]
	-- WHERE ROW_NUM = 1
    
    SELECT
        qTmpFn.[TMPL_UID],
        qTmpFn.[DOC_REF_NO],
        qTmpFn.[VLD_VER_UID],
        result.[ASGN_UID],
        result.[GUID] AS ASGN_GUID,
        result.ROW_NUM
    INTO #ASGN_Q_TMPL
    FROM #AsgnQ_VLD_VER result
    OUTER APPLY [Census].[FN_GET_Q_TMPL_BY_ASGN_UID_OR_GUID](result.[ASGN_UID], result.[GUID]) qTmpFn
    WHERE result.ROW_NUM = 1;

	--SELECT asgn.[ASGN_UID]
	--into #lastRoundRmks
	--FROM [Census].[CM_ASGN_MAIN] asgn (NOLOCK)
	--INNER JOIN [Census].[CM_ASGN_RMKS] rmks (NOLOCK) ON rmks.[ASGN_UID] = asgn.[PREV_ASGN_UID]
	--GROUP BY asgn.[ASGN_UID]

	--Qc Log Offline
	if (@pPageSize = 1000 or @pAssignmentGuid IS NOT NULL) -- retrieve when offline mode or details page
	BEGIN
		SET @pQcLogJson = ''
	END

	if (@pPageSize = 1000 or @pAssignmentGuid IS NOT NULL) -- retrieve when offline mode or details page
	BEGIN
		SET @pQcLogSubSurveyJson = (
			SELECT *
			FROM (
				SELECT srvy.[SRVY_CD],	       
						qcLogQcCftSub.[QC_RSLT],
						qcLogQcCftSub.[RMKS],
						qcLogQcCftSub.[SRVY_UID],
						qcLogQcCftSub.[SUB_RSLT_UID],
						qcLogQcCftSub.[QC_RSLT_UID]
				FROM #assignments asgnLst
				INNER JOIN [Census].[CM_QC_LOG] qcLog (NOLOCK) ON qcLog.[ASGN_UID] = asgnLst.[ASGN_UID]
				INNER JOIN [Census].[CM_REF_QC_TYP] refQcTyp (NOLOCK) ON refQcTyp.[QC_TYP_UID] = qcLog.[QC_TYP_UID] AND refQcTyp.[QC_CD] = 'CFT'
				INNER JOIN [Census].[CM_QC_LOG_QC_CFT] qcLogQcCft (NOLOCK) ON qcLogQcCft.[QC_LOG_UID] = qcLog.[QC_LOG_UID] AND refQcTyp.[QC_CD] = 'CFT'
				INNER JOIN [Census].[CM_QC_LOG_QC_CFT_SUB] qcLogQcCftSub (NOLOCK) ON qcLogQcCftSub.[QC_RSLT_UID] = qcLogQcCft.[QC_RSLT_UID]
				INNER JOIN [Census].[CM_SC] sc (NOLOCK)	ON sc.[SC_UID] = asgnLst.[SC_UID]
				INNER JOIN [Census].[CM_SRVY] srvy (NOLOCK)	ON srvy.[SRVY_UID] = sc.[SRVY_UID]
				WHERE @pAssignmentGuid IS NOT NULL OR asgnLst.[DL_ASGN] = 1
				UNION
				SELECT srvy.[SRVY_CD],	       
						qcLogVerfAdtChkSub.[QC_RSLT],
						'' [RMKS],
						qcLogVerfAdtChkSub.[SRVY_UID],
						qcLogVerfAdtChkSub.[SUB_RSLT_UID],
						qcLogVerfAdtChk.[QC_RSLT_UID]
				FROM #assignments asgnLst
				INNER JOIN [Census].[CM_QC_LOG] qcLog (NOLOCK) ON qcLog.[ASGN_UID] = asgnLst.[ASGN_UID]
				INNER JOIN [Census].[CM_REF_QC_TYP] refQcTyp (NOLOCK) ON refQcTyp.[QC_TYP_UID] = qcLog.[QC_TYP_UID] AND refQcTyp.[QC_CD] = 'VC'
				INNER JOIN [Census].[CM_QC_LOG_VERF_ADT_CHK] qcLogVerfAdtChk (NOLOCK) ON qcLogVerfAdtChk.[QC_LOG_UID] = qcLog.[QC_LOG_UID] AND refQcTyp.[QC_CD] = 'VC'
				INNER JOIN [Census].[CM_QC_LOG_VERF_ADT_CHK_SUB] qcLogVerfAdtChkSub (NOLOCK) ON qcLogVerfAdtChkSub.[QC_RSLT_UID] = qcLogVerfAdtChk.[QC_RSLT_UID]
				INNER JOIN [Census].[CM_SC] sc (NOLOCK)	ON sc.[SC_UID] = asgnLst.[SC_UID]
				INNER JOIN [Census].[CM_SRVY] srvy (NOLOCK)	ON srvy.[SRVY_UID] = sc.[SRVY_UID]
				WHERE @pAssignmentGuid IS NOT NULL OR asgnLst.[DL_ASGN] = 1
			) [result]
			FOR JSON PATH
		)
	END

    if (@pPageSize = 1000 or @pAssignmentGuid IS NOT NULL) -- retrieve when offline mode or details page
    BEGIN
        set @pOQSeperateAccountJson = (
            select 
                sepAcct.[ASGN_UID],
                sepAcct.[PP_NO],
                sepAcct.[ACCT_SERL_NO],
                sepAcct.[STS]
            from #assignments asgnLst
            inner join [Census].CM_ASGN_OQ_SEP_ACCT sepAcct on asgnLst.ASGN_UID = sepAcct.ASGN_UID
            where @pAssignmentGuid is not null or asgnLst.DL_ASGN = 1
            for json path
        )
    END

	SELECT asgn.[ASGN_UID]
		  ,asgn.[GUID]
		  ,CAST(asgn.[IS_SHOW] AS BIT) [IS_SHOW]
		  ,asgn.[QTR_UID]
		  ,asgn.[ASGN_STS]
		  ,asgn.[ASGN_STG_IND]
		  ,asgn.[ENUM_RSLT_CD]
		  ,enumRsltCd.[RSLT_DESCR] [ENUM_RSLT_CD_DESCR]
		  ,asgn.[OQ_ACCT_IND]
		  ,asgn.[ASGN_PRTY]
		  ,asgn.[NFA_IND]
		  ,asgn.[NFV_IND]
		  ,asgn.[RFSL_IND]
		  ,asgn.[PSU_NO]
		  ,asgn.[HH_NO]
		  ,asgn.[UPD_DT]
		  ,asgn.[RFSL_LVL]
		  ,asgn.[ASGN_SRC]
		  ,asgn.[OCP_IND]
		  ,asgn.[DEL_IND]
		  ,asgn.[EOE_RSN_CD]
		  ,asgn.[GHS_CASE_IND]
		  ,ISNULL(asgn.[NCD_CSC_SUM],0) + ISNULL(asgn.[NCD_FC_SUM],0) [NCD_SUM]
		  ,ISNULL(asgn.[NCN_CSC_SUM],0) + ISNULL(asgn.[NCN_FC_SUM],0) [NCN_SUM]
		  ,srvyEoeRsnCd.[RSLT_DESCR] [EOE_RSN_CD_DESCR]
		  ,ocpIndCd.[LBL_ENG] [OCP_IND_DESCR]
		  ,ISNULL(asgn.[MAIL_ADDR_ENG_1],@emptyStr) [MAIL_ADDR_ENG_1] ,ISNULL(asgn.[MAIL_ADDR_ENG_2],@emptyStr) [MAIL_ADDR_ENG_2] ,ISNULL(asgn.[MAIL_ADDR_ENG_3],@emptyStr) [MAIL_ADDR_ENG_3]
		  ,ISNULL(asgn.[MAIL_ADDR_ENG_4],@emptyStr) [MAIL_ADDR_ENG_4] ,ISNULL(asgn.[MAIL_ADDR_ENG_5],@emptyStr) [MAIL_ADDR_ENG_5] ,ISNULL(asgn.[MAIL_ADDR_ENG_6],@emptyStr) [MAIL_ADDR_ENG_6]
		  ,ISNULL(asgn.[MAIL_ADDR_CHI_1],@emptyStr) [MAIL_ADDR_CHI_1] ,ISNULL(asgn.[MAIL_ADDR_CHI_2],@emptyStr) [MAIL_ADDR_CHI_2] ,ISNULL(asgn.[MAIL_ADDR_CHI_3],@emptyStr) [MAIL_ADDR_CHI_3]
		  ,ISNULL(asgn.[MAIL_ADDR_CHI_4],@emptyStr) [MAIL_ADDR_CHI_4] ,ISNULL(asgn.[MAIL_ADDR_CHI_5],@emptyStr) [MAIL_ADDR_CHI_5]
		  --,asgn.[SEL_APRV_POSN_UID]
		  ,asgn.[ASGN_REF_NO]
		  ,asgn.[NEW_ASGN_TYP]
		  ,asgn.[CASE_TYP] -- add for 26C
		  ,asgn.[WRG_ADDR_IND] -- add for 26C
          ,asgn.[CONF_MO_HH_IND] -- add for 26C
          ,asgn.[REQ_HH_LTR_IND] -- add for 26C
          ,asgn.[SKP_RMDR_IND] -- add for 26C
		  ,asgn.[COND_SRCH_IND] -- add for 26C
		  ,asgn.[SP_CASE_IND] -- add for 26C
		  ,asgnLtr.[LTR_CD]
		  ,asgn.[DL_ASGN]
		  ,bldg.[BLDG_UID]
		  ,bldg.[BLDG_TYP]
		  ,bldg.[BMO_LTR_IND]
		  ,bldg.[BLDG_SERL]
		  ,bldg.[PLOT]
		  ,bldg.[DC]
		  ,bldg.[CA]
		  ,bldg.[YR_BLDG]
		  ,bldg.[BLDG_MGT]
		  ,bldgMgt.[LBL_ENG] [BLDG_MGT_DESCR]
		  ,bldgAddr.[BLDG_NAME_ENG]
		  ,bldgAddr.[BLDG_NAME_CHI]
		  ,bldgAddr.[EST_NAME_ENG]
		  ,bldgAddr.[EST_NAME_CHI]
		  ,qtrAddr.[FLR] [FLR_ENG]
		  ,qtrAddr.[FLR_CHI] [FLR_CHI]
		  ,qtrAddr.[FLAT] [FLAT_ENG]
		  ,qtrAddr.[FLAT_CHI] [FLAT_CHI]
		  ,bldg.[LIFT_IND]
	  	  ,Srvy.[SRVY_UID]
		  ,Srvy.[SRVY_CD]
		  ,Srvy.[NAME_ENG] [SRVY_NAME_ENG]
		  ,Srvy.[NAME_CHI] [SRVY_NAME_CHI]
		  ,Srvy.[DF_SUBM]
		  ,Sc.[SC_UID] [SRVY_CYCLE_UID]
		  ,Sc.[SC_CD] [SRVY_CYCLE_CODE]
		  ,Sc.[OPER_END_DT] [SRVY_CYCLE_OPER_END_DT]
		  ,Sc.[WF_UID]
		  ,cast(qtr.[LQ_SERL] as varchar(10)) as [LQ_SERL]
		  ,qtr.[PAIR_VST_IND]
		  ,qtr.[QTR_TYP]
		  ,qtr.[UC_UID]
		  ,qtr.[SUSP_SDU_IND]
		  ,qtr.[TTL_ATCH]
		  ,qtr.[BL_ATCH_NO]
		  ,qtr.[RT_ATCH_NO]
		  ,qtr.[TPS_BRO_IND]
		  ,qtr.[PSTL_IND]
		  ,qtr.[MERG_IND]
		  ,qtr.[SLD_FLT_IND]
		  ,qtr.[LQ_TYP]
		  ,pstlIndCd.[LBL_ENG] [PSTL_IND_DESCR]
		  ,ISNULL(qtrAddr.[ADDR_ENG_1],@emptyStr) [ADDR_ENG_1] ,ISNULL(qtrAddr.[ADDR_ENG_2],@emptyStr) [ADDR_ENG_2] ,ISNULL(qtrAddr.[ADDR_ENG_3],@emptyStr) [ADDR_ENG_3]
		  ,ISNULL(qtrAddr.[ADDR_ENG_4],@emptyStr) [ADDR_ENG_4] ,ISNULL(qtrAddr.[ADDR_ENG_5],@emptyStr) [ADDR_ENG_5]
		  ,ISNULL(qtrAddr.[ADDR_CHI_1],@emptyStr) [ADDR_CHI_1] ,ISNULL(qtrAddr.[ADDR_CHI_2],@emptyStr) [ADDR_CHI_2] ,ISNULL(qtrAddr.[ADDR_CHI_3],@emptyStr) [ADDR_CHI_3]
		  ,ISNULL(qtrAddr.[ADDR_CHI_4],@emptyStr) [ADDR_CHI_4] ,ISNULL(qtrAddr.[ADDR_CHI_5],@emptyStr) [ADDR_CHI_5]
		  ,refUc.[UC]
		  ,refUc.[UC_DESCR]
		  ,rfslIndCd.[LBL_ENG] [RFSL_IND_DESCR]
		  ,rfsLvlCd.[LBL_ENG] [RFSL_LVL_DESCR]
		  ,asgnHldLst.[HLD_STS]
		  ,asgnQVer.[DF_HDL_STS]
		  ,dfhStsCd.[LBL_ENG] [DF_HDL_STS_DESCR]
		  ,asgn.[POSN_RT]
		  ,respStfProf.[NAME_ENG] [Responsible_Officer_English_Name]
		  ,respStfProf.[NAME_CHI] [Responsible_Officer_Chinese_Name]
		  ,respStfProf.[STF_NO_GHS] [Responsible_Officer_Code]
		  ,respStfPosn.[STF_UID] [RESP_STF_UID]
		  ,respStfPosn.[POSN_UID] [RESP_POSN_UID]
		  ,respPosn.[POSN_CD] [RESP_POSN_CD]
		  ,teamOrgUnit.[OU_UID] [TEAM_OU_UID]
		  ,teamOrgUnit.[NAME_ENG] [TEAM_NAME_ENG]
		  ,poolOrgUnit.[OU_UID] [POOL_OU_UID]
		  ,poolOrgUnit.[NAME_ENG] [POOL_OU_NAME_ENG]
		  ,asgn.[PREV_ASGN_UID] [REPT_ASGN_UID]
		  ,repeatedAsgn.[ASGN_REF_NO] [REPT_ASGN_REF_NO]
		  ,seg.[SEG_UID]
		  ,seg.[SEG_KEY]
		  ,IIF(bldg.[SEG_UID] IS NOT NULL, 'Y', 'N') [SEG_KEY_CASE]
		  ,seg.[HR_IND]
		  ,bldgAddr.[ADDR_LAT] [X_Coor]
		  ,bldgAddr.[ADDR_LONG] [Y_Coor]
		  ,bldg.[SEG_IND]
		  ,RefDcca.[DCCA_ENG]
		  ,pairVstIndCd.[LBL_ENG] [PAIR_VST_IND_DESCR]
		  ,RefDcca.[DCCA_CHI]
		  ,qTmpl.[TMPL_UID]
		  ,qVldVer.[VLD_VER_NO] [TMPL_VLD_VER_NO]
		  ,qVldVer.[VLD_VER_UID]
		  ,qVldRule.[DOC_REF_NO] [RULE_DOC_REF_NO]
		  ,qTmpl.[DOC_REF_NO] [TEMP_DOC_REF_NO]
		  ,validQData.[TB_NAME]
		  ,ISNULL(validQData.[Q_DATA_VER_NO], 0) [Q_DATA_VER_NO]
		  ,validQData.[DOC_REF_NO] [SUB_DOC_REF_NO]
		  ,validQData.[Q_DATA_TYP]
		  ,validQData.[Q_DATA_STS]
		  ,validQData.[ENUM_MDE]
		  ,vaildDatarefEnumMdeall.[EM_DESCR] [ENUM_MDE_DESCR]
		  ,ltRdvalidQData.[TB_NAME] [LT_RD_TB_NAME]
		  ,ltRdvalidQData.[DOC_REF_NO] [LT_RD_SUB_DOC_REF_NO]
		  ,indrQData.[TB_NAME] [INDR_TB_NAME]
		  ,indrQData.[DOC_REF_NO] [INDR_DOC_REF_NO]
		  ,fldQData.[TB_NAME] [FLD_TB_NAME]
		  ,fldQData.[DOC_REF_NO] [FLD_DOC_REF_NO]
		  ,fuQData.[TB_NAME] [FU_TB_NAME]
		  ,fuQData.[DOC_REF_NO] [FU_DOC_REF_NO]
		  ,fuQData.[Q_DATA_VER_NO] [FU_Q_DATA_VER_NO]
		  ,ISNULL(latestQData.[Q_DATA_VER_NO], 0) [LAT_Q_DATA_VER_NO]
		  ,asgnQVer.[PR_OQ_STS]
		  ,oqStsCd.[LBL_ENG] [PR_OQ_STS_DESCR]
		  ,asgn.[DC_RTN_MDE]
		  ,refEnumMde.[EM_DESCR]
		  ,CASE WHEN(usrAsgnBkm.[STF_UID] IS NOT NULL) THEN 'Y' ELSE 'N' END AS [BKM]
		  ,asgnAprvReq.[APRV_REQ_UID]
		  ,asgnAprvReq.[GUID] [APRV_REQ_GUID]
		  ,asgnAprvReq.[REQ_BY_STF_UID]
		  ,asgnAprvReq.[REQ_BY_STF_NO]
		  ,asgnAprvReq.[REQ_BY_STF_NAME_ENG]
		  ,asgnAprvReq.[REQ_BY_STF_NAME_CHI]
		  ,asgnAprvReq.[REQ_BY_POSN_UID]
		  ,asgnAprvReq.[REQ_BY_POSN_CD]
		  ,asgnAprvReq.[REQ_BY_POSN_NAME_ENG]
		  ,asgnAprvReq.[REQ_BY_POSN_NAME_CHI]
		  ,asgnAprvReq.[REQ_DT]
		  ,asgnAprvReq.[REQ_RMKS]
		  ,asgnAprvReq.[SEL_APRV_STF_UID]
		  ,asgnAprvReq.[SEL_APRV_STF_NO]
		  ,asgnAprvReq.[SEL_APRV_STF_NAME_ENG]
		  ,asgnAprvReq.[SEL_APRV_STF_NAME_CHI]
		  ,asgnAprvReq.[SEL_APRV_POSN_UID]
		  ,asgnAprvReq.[SEL_APRV_POSN_CD]
		  ,asgnAprvReq.[SEL_APRV_POSN_NAME_ENG]
		  ,asgnAprvReq.[SEL_APRV_POSN_NAME_CHI]
		  ,asgnAprvReq.[APRV_STF_UID]
		  ,asgnAprvReq.[APRV_STF_NO]
		  ,asgnAprvReq.[APRV_STF_NAME_ENG]
		  ,asgnAprvReq.[APRV_STF_NAME_CHI]
		  ,asgnAprvReq.[APRV_POSN_UID]
		  ,asgnAprvReq.[APRV_POSN_CD]
		  ,asgnAprvReq.[APRV_POSN_NAME_ENG]
		  ,asgnAprvReq.[APRV_POSN_NAME_CHI]
		  ,asgnAprvReq.[APRV_STS]
		  ,aprvStsCd.[LBL_ENG] [APRV_STS_DESCR]
		  ,asgnAprvReq.[APRV_DT]
		  ,asgnAprvReq.[APRV_RMKS]
		  ,usrAsgnBkm.[RMKS] [BKM_RMKS]
		  ,usrAsgnBkm.[UPD_DT] [BKM_UPD_DT]
		  ,CASE WHEN(cfgAsgnSts.[FLD_OS_IND] = 'N') THEN 'Y' ELSE 'N' END [FLD_OS_IND]
		  ,appt.[APPT_DT_NEW] [LST_APPT_DT_NEW]
		  ,appt.[APPT_DT_END] [LST_APPT_DT_END]
		  ,DATEADD(HOUR, DATEPART(HOUR, appt.APPT_DT_STRT), 
				DATEADD(MINUTE, DATEPART(MINUTE, appt.APPT_DT_STRT), 
				DATEADD(SECOND, DATEPART(SECOND, appt.APPT_DT_STRT), 
				CAST(appt.APPT_DT_NEW AS DATETIME)))) [APPT_DT_STRT]
		  ,DATEADD(HOUR, DATEPART(HOUR, appt.APPT_DT_STRT), 
				DATEADD(MINUTE, DATEPART(MINUTE, appt.APPT_DT_STRT), 
				DATEADD(SECOND, DATEPART(SECOND, appt.APPT_DT_STRT), 
				CAST(appt.APPT_DT_NEW AS DATETIME)))) [LST_APPT_DT_STRT]
		  ,appt.[INTV_MDE] [LST_APPT_INTV_MDE]
		  ,intvLog.[INTV_MDE] [LST_INTV_LOG_INTV_MDE]
		  --,lstAsgnHhCont.[TEL_1] [LST_CONT_TEL_1]
		  --,lstAsgnHhCont.[TEL_2] [LST_CONT_TEL_2]
		  --,lstAsgnHhCont.[TEL_EXT_1] [LST_CONT_TEL_EXT_1]
		  --,lstAsgnHhCont.[TEL_EXT_2] [LST_CONT_TEL_EXT_2]
		  ,CASE
			WHEN lstDfltAsgnHhCont.[HH_CONT_UID] IS NOT NULL THEN lstDfltAsgnHhCont.[TEL_1]
			WHEN lstAsgnHhCont.[HH_CONT_UID] IS NOT NULL THEN lstAsgnHhCont.[TEL_1] 
			ELSE NULL
		  END [LST_CONT_TEL_1]
		  ,CASE
			WHEN lstDfltAsgnHhCont.[HH_CONT_UID] IS NOT NULL THEN lstDfltAsgnHhCont.[TEL_2]
			WHEN lstAsgnHhCont.[HH_CONT_UID] IS NOT NULL THEN lstAsgnHhCont.[TEL_2] 
			ELSE NULL
		  END [LST_CONT_TEL_2]
		  ,CASE
			WHEN lstDfltAsgnHhCont.[HH_CONT_UID] IS NOT NULL THEN lstDfltAsgnHhCont.[TEL_EXT_1]
			WHEN lstAsgnHhCont.[HH_CONT_UID] IS NOT NULL THEN lstAsgnHhCont.[TEL_EXT_1] 
			ELSE NULL
		  END [LST_CONT_TEL_EXT_1]
		  ,CASE
			WHEN lstDfltAsgnHhCont.[HH_CONT_UID] IS NOT NULL THEN lstDfltAsgnHhCont.[TEL_EXT_2]
			WHEN lstAsgnHhCont.[HH_CONT_UID] IS NOT NULL THEN lstAsgnHhCont.[TEL_EXT_2] 
			ELSE NULL
		  END [LST_CONT_TEL_EXT_2]
		  ,CASE
			WHEN lstDfltAsgnHhCont.[HH_CONT_UID] IS NOT NULL THEN lstDfltAsgnHhCont.[PREF_MDE]
			WHEN lstAsgnHhCont.[HH_CONT_UID] IS NOT NULL THEN lstAsgnHhCont.[PREF_MDE] 
			ELSE NULL
		  END [LST_CONT_PREF_MDE]
		  ,CASE
			WHEN lstDfltAsgnHhCont.[HH_CONT_UID] IS NOT NULL THEN lstDfltAsgnHhCont.[PREF_TIME_SLOT]
			WHEN lstAsgnHhCont.[HH_CONT_UID] IS NOT NULL THEN lstAsgnHhCont.[PREF_TIME_SLOT] 
			ELSE NULL
		  END [LST_CONT_PREF_TIME_SLOT]
		  ,validQData.[UPD_DT] [Q_DATA_UPD_DT]
		  ,indrQData.[Q_DATA_VER_NO] [MIST_VER_NO]
		  --,othAsgn.[OtherAssignmentReferenceDateTimeJson]
		  ,CAST('' AS NVARCHAR(MAX)) [InterviewLogJson]
		  ,CAST('' AS NVARCHAR(MAX)) [AssignmentDetailJson]
		  ,CAST('' AS NVARCHAR(MAX)) [AppointmentBookingJson]
		  ,CAST('' AS NVARCHAR(MAX)) [ContactJson]
		  ,CAST('' AS NVARCHAR(MAX)) [EnquiryLogJson]
		  ,CAST('' AS NVARCHAR(MAX)) [ItineraryPlanJson]
		  ,CAST('' AS NVARCHAR(MAX)) [ActivitiesJson]
		  ,CAST('' AS NVARCHAR(MAX)) [EFieldCardJson]
		  ,CAST('' AS NVARCHAR(MAX)) [SubmissionVersionJson]
		  --,cursory.[cursoryCheckList]
		  --,indepth.[inDepthCheckList]
		  --,firststage.[firstStageCheckList]
		  --,secondstage.[secondStageCheckList]
		  --,adminDataPreFill.[adminDataPrefillList]
		  ,IIF(ISNULL(SketchMap.ASGN_UID,0) = 0, 'N', 'Y') [SHK_MAP_IND]
		  ,IIF(seg.SEG_UID IS NULL, 'N', 'Y') [SEG_MAP_IND]
		  --,IIF(SegmentMapCoord.[ASGN_UID] IS NULL, 'N', 'Y') [SEG_MAP_IND]
		  ,oqRegDt.[REG_DT]
		  ,oqRegDt.[SUBM_DT]
		  ,CAST('' AS NVARCHAR(MAX)) [SUB_SRVY_LST]
		  ,ISNULL(asgn.[QC_SAMP_IND], 'N') [QC_SAMP_IND]
		  ,ISNULL(indrQDataInfo.[REQ_FU_IND], 'N') [REQ_FU_IND]
		  ,asgnRefNo.[FLD_VAL] [REF_NO]
		  ,attRefNo.[FLD_VAL] [REF_ATT_NO]
		  ,CASE WHEN LEN(hhRefNo.[FLD_VAL]) = 1 THEN '0' + hhRefNo.[FLD_VAL] ELSE hhRefNo.[FLD_VAL] END [REF_HH_NO]
		  ,CAST('' AS NVARCHAR(MAX)) [Q_IMG_LST]
		  ,bldg.[BLDG_CSUID_LST]
		  ,IIF(ASGN_ALLOC_HIST.[ASGN_UID] IS NULL, 'N', 'Y') [REALLOC_IND]
		  --,IIF(#lastRoundRmks.[ASGN_UID] IS NULL, 'N', 'Y') [REPT_ASGN_RMKS_IND]
		  ,IIF(ISNULL(#lastRoundRmks.NUM_OF_RMKS,0) > 0, 'Y', 'N') [REPT_ASGN_RMKS_IND]
		  ,asgn.[MIST_TYP]
		  ,asgn.[MIST_RMKS] [MIST_TYP_RMKS]
		  ,bldgMagntOfce.[BMO_IND]
		  ,IIF(asgn.[INIT_MDE] in (4,5), 'Y', 'N') [OQ_IND]
          ,CASE WHEN EXISTS (SELECT 1 FROM CENSUS.CM_ASGN_OQ_SEP_ACCT oqSepAcct (NOLOCK) WHERE oqSepAcct.[ASGN_UID] = asgn.[ASGN_UID] AND oqSepAcct.ACCT_SERL_NO != '01' AND oqSepAcct.STS = 'S') THEN 'Y' ELSE 'N' END [OQ_SEP_ACCT_IND]
		  ,IIF(qtr.[ACTL_TTL_ATCH] > 0, 'Y', 'N') [ATT_IND]
		  ,qtr.[ACTL_TTL_ATCH]
		  ,qtr.[ACTL_TTL_SDU]
		  ,qtr.[HH_CNT]
		  ,asgn.[RPLT_NO]
		  ,qtr.[MAIN_SDU]
		  ,qtr.[MAIN_MERG_REF]
		  ,qtr.[RMKS] [QTR_RMKS]
		  ,refBldgTyp.[BT_DESCR]
		  ,refQtrTyp.[DESCR_ENG] [QTR_TYP_DESCR_ENG]
		  ,FORMAT(sc.SRVY_MTH, '00') [MM]
		  ,FORMAT(sc.SRVY_YR, '0000') [YYYY]
		  ,asgn.[NFUQC_IND]
		  ,asgn.[FU_QC_IND]
		  ,IIF(asgn.[FU_QC_IND] = 'QC' OR asgn.[FU_QC_IND] = 'FUQC', 'Y', 'N') [FU_QC_IND_YN]
		  ,CAST('' AS NVARCHAR(MAX)) [QC_LOG_LST]
		  ,respStfProf.[STF_NO] [RESP_STF_NO]
		  ,qtr.[SDU_IND]
		  ,ALLOC_TO_IND
		  ,asgn.[REACT_EXP_DATE]
		  ,asgnOQAcct.[ACT_KEY]
		  ,IIF(ISNULL(asgnRmks.NO_OF_RMK, 0) > 0, 'Y', 'N') [RMKS_IND]
		  ,IIF(reviewQData.ASGN_UID IS NULL, 'N', 'Y') [RVW_IND]
		  ,dlRec.[STS] [DLREC_STS] --#536 add download indicator, A = active, D = deactive
		  ,CASE WHEN prevRound.ASGN_UID IS NULL THEN 'N'	--684 Added LT_RD_IND
				ELSE 'Y'
			END [LT_RD_IND]
		  ,qDataPref.[FLD_VAL] AS [FSQ_JSON_CONTENT]
		  ,CASE WHEN sameRespondent.ASGN_UID IS NOT NULL THEN 'Y' ELSE 'N' END [SARE_IND] -- Same Respondent indicator
	  FROM #assignments asgn
	  LEFT JOIN #ASGN_Q_TMPL qTmp ON qTmp.ASGN_UID = asgn.ASGN_UID
	  INNER JOIN [Census].[CM_SC] (NOLOCK) sc							ON asgn.[SC_UID]				= sc.[SC_UID]
	  INNER JOIN [Census].[CM_SRVY] (NOLOCK) Srvy						ON Sc.[SRVY_UID]				= Srvy.[SRVY_UID]
	  INNER JOIN [Census].[CM_QTR] (NOLOCK) qtr							ON qtr.[QTR_UID]				= asgn.[QTR_UID]
	  LEFT JOIN [Census].[CM_QTR_ADDR] (NOLOCK) qtrAddr				ON qtr.[QTR_UID]				= qtrAddr.[QTR_UID]
	  LEFT JOIN [Census].[CM_BLDG_ADDR] (NOLOCK) bldgAddr				ON bldgAddr.[BLDG_ADDR_UID]		= qtrAddr.[BLDG_ADDR_UID]
	  INNER JOIN [Census].[CM_BLDG] (NOLOCK) bldg						ON bldg.[BLDG_UID]				= bldgAddr.[BLDG_UID]
	  LEFT JOIN [Census].[CM_SEG] (NOLOCK) seg ON seg.[SEG_UID] = bldg.[SEG_UID]
	  INNER JOIN [Census].[CM_REF_DCCA] (NOLOCK) RefDcca				ON RefDcca.[CA]					= bldg.[CA] AND RefDcca.[DC] = bldg.[DC] 
	  --LEFT JOIN Census.CM_ASGN_ALLOC asgnAlloc (NOLOCK) ON asgnAlloc.ASGN_UID = Asgn.ASGN_UID
	  --LEFT JOIN [Census].[VW_CM_GET_CURR_STF_POSN] respstfPosn (NOLOCK) ON (asgnAlloc.ALLOC_TO_IND = 'E' AND asgnAlloc.STF_POSN_UID_ENUM = respstfPosn.STF_POSN_UID)
	  LEFT JOIN [Census].[VW_CM_GET_ASGN_ALLOC_RESP] asgnAlloc (NOLOCK) ON asgnAlloc.[ASGN_UID] = asgn.[ASGN_UID]
	  LEFT JOIN [Census].[VW_CM_GET_CURR_STF_POSN] respStfPosn (NOLOCK)	ON asgnAlloc.[POSN_UID] = respStfPosn.[POSN_UID] AND respStfPosn.[STS] = 'A'  -- Mantis#4779: aligned with SP_CM_GET_HH_ASGN_LIST_BY_PAGE
	  LEFT JOIN Census.CM_STF_PROF respStfProf (NOLOCK) ON respStfProf.STF_UID = respstfPosn.STF_UID
	  LEFT JOIN Census.CM_POSN respPosn (NOLOCK) ON respPosn.POSN_UID = respstfPosn.POSN_UID
	  --LEFT  JOIN [Census].[VW_CM_GET_ASGN_ALLOC_RESP] asgnAlloc			ON asgnAlloc.[ASGN_UID]			= asgn.[ASGN_UID] 
	  --LEFT  JOIN [Census].[VW_CM_GET_CURR_STF_POSN] respstfPosn			ON asgnAlloc.[STF_POSN_UID]		= respstfPosn.[STF_POSN_UID]
	  --LEFT  JOIN [Census].[CM_STF_PROF] (NOLOCK) respStfProf			ON respStfProf.[STF_UID]		= respstfPosn.[STF_UID]
	  --LEFT  JOIN [Census].[CM_POSN] (NOLOCK) respPosn					ON respPosn.[POSN_UID]			= respStfPosn.[POSN_UID]
	  LEFT  JOIN [Census].[CM_ORG_UNIT] (NOLOCK) teamOrgUnit			ON teamOrgUnit.[OU_UID]			= respPosn.[OU_UID]
	  LEFT  JOIN [Census].[CM_ORG_UNIT] (NOLOCK) poolOrgUnit			ON poolOrgUnit.[OU_UID]			= teamOrgUnit.[PAR_OU_UID]
	  LEFT  JOIN [Census].[CM_ASGN_REF_NO] (NOLOCK) asgnRefNo			ON asgnRefNo.[ASGN_UID]			= asgn.[ASGN_UID] AND asgnRefNo.[FLD_ID] = 'REFNO'
	  LEFT  JOIN [Census].[CM_ASGN_REF_NO] (NOLOCK) attRefNo			ON attRefNo.[ASGN_UID]			= asgn.[ASGN_UID] AND attRefNo.[FLD_ID] = 'ATT'
	  LEFT  JOIN [Census].[CM_ASGN_REF_NO] (NOLOCK) hhRefNo				ON hhRefNo.[ASGN_UID]			= asgn.[ASGN_UID] AND hhRefNo.[FLD_ID] = 'HH'
	  LEFT  JOIN [Census].[CM_SRVY_EOE_RSN_CD] (NOLOCK) srvyEoeRsnCd	ON srvyEoeRsnCd.[SRVY_UID]		= Srvy.[SRVY_UID] AND srvyEoeRsnCd.[RSN_CD] = asgn.[EOE_RSN_CD]	  
	  LEFT  JOIN [Census].[CM_ASGN_LTR] (NOLOCK)	asgnLtr				ON asgnLtr.[ASGN_UID]			= asgn.[ASGN_UID]
	  LEFT  JOIN [Census].[CM_CFG_ASGN_STS] (NOLOCK) cfgAsgnSts			ON cfgAsgnSts.[ASGN_STS]		= asgn.[ASGN_STS] AND cfgAsgnSts.[SRVY_UID] = srvy.[SRVY_UID]
	  LEFT  JOIN [Census].[CM_REF_UC] (NOLOCK) refUc					ON refUc.[UC_UID]				= qtr.[UC_UID] AND refUc.[STS] = 'A'
	  LEFT  JOIN [Census].[CM_ASGN_MAIN] (NOLOCK) repeatedAsgn			ON repeatedAsgn.[ASGN_UID]		= asgn.[PREV_ASGN_UID]
	  LEFT  JOIN [Census].[CM_ASGN_HLD_LST] (NOLOCK) asgnHldLst			ON asgnHldLst.[ASGN_UID]		= asgn.[ASGN_UID]
	  --OUTER APPLY [Census].[FN_GET_Q_TMPL_BY_ASGN_UID_OR_GUID](asgn.[ASGN_UID], asgn.[GUID]) qTmp
	  LEFT  JOIN [Census].[CM_Q_VLD_VER] (NOLOCK) qVldVer				ON qVldVer.[VLD_VER_UID]		= qTmp.[VLD_VER_UID]
	  LEFT  JOIN [Census].[CM_Q_TMPL] (NOLOCK) qTmpl					ON qTmpl.[TMPL_UID]				= qVldVer.[TMPL_UID]
	  LEFT  JOIN [Census].[CM_Q_VLD_RULE] (NOLOCK) qVldRule				ON qVldRule.[VLD_VER_UID]		= qVldVer.[VLD_VER_UID] AND qVldRule.[STS] = 'A'
	  LEFT  JOIN [Census].[CM_ASGN_Q_VER] (NOLOCK) asgnQVer				ON asgnQVer.[ASGN_UID]			= asgn.[ASGN_UID]
	  LEFT  JOIN [Census].[CM_CD_TBL_DTL] (NOLOCK) dfhStsCd				ON dfhStsCd.[CD_TYP]			= @dfhStsStr AND dfhStsCd.[CD_VAL] = asgnQVer.[DF_HDL_STS]
	  LEFT  JOIN [Census].[CM_ASGN_Q_VER] (NOLOCK) ltRdAsgnQVer			ON ltRdAsgnQVer.[ASGN_UID]		= asgn.[PREV_ASGN_UID]
	  LEFT  JOIN [Census].[CM_CD_TBL_DTL] (NOLOCK) oqStsCd				ON oqStsCd.[CD_TYP]				= @OqStsStr AND oqStsCd.[CD_VAL] = asgnQVer.[PR_OQ_STS] AND oqStsCd.[STS] = 'A'
	  LEFT  JOIN [Census].[CM_REF_ENUM_MDE] (NOLOCK)	refEnumMde		ON refEnumMde.[EM_CD]			= asgn.[DC_RTN_MDE] AND refEnumMde.[STS] = 'A'
	  LEFT  JOIN [Census].[CM_USR_ASGN_BKM] (NOLOCK) usrAsgnBkm			ON usrAsgnBkm.[ASGN_UID]		= asgn.[ASGN_UID] AND usrAsgnBkm.[STF_UID] = @sStfUid AND usrAsgnBkm.[STS] = 'A'
	  LEFT  JOIN [Census].[CM_CD_TBL_DTL] (NOLOCK) pairVstIndCd			ON pairVstIndCd.[CD_TYP]		= @pairVstIndStr AND qtr.[PAIR_VST_IND] = pairVstIndCd.[CD_VAL] AND pairVstIndCd.[STS] = 'A'
	  LEFT  JOIN [Census].[CM_Q_DATA_INFO] (NOLOCK) validQData			ON validQData.[ASGN_UID]		= asgn.[ASGN_UID] AND validQData.[Q_DATA_VER_NO] = asgnQVer.[CUR_VER_NO] AND asgn.[DL_ASGN] = 1
	  LEFT  JOIN [Census].[CM_Q_DATA_INFO] (NOLOCK) ltRdvalidQData		ON ltRdvalidQData.[ASGN_UID]	= asgn.[PREV_ASGN_UID] AND ltRdvalidQData.[Q_DATA_VER_NO] = ltRdAsgnQVer.[CUR_VER_NO] AND asgn.[DL_ASGN] = 1
	  LEFT  JOIN [Census].[CM_Q_DATA_INFO] (NOLOCK) indrQData			ON indrQData.[ASGN_UID]			= asgn.[ASGN_UID] AND indrQData.[Q_DATA_VER_NO] = asgnQVer.[INDR_VER_NO] AND asgn.[ASGN_STG_IND] in ('F','PF')  AND asgn.[DL_ASGN] = 1
	  LEFT  JOIN [Census].[CM_Q_DATA_INFO] (NOLOCK) fldQData			ON fldQData.[ASGN_UID]			= asgn.[ASGN_UID] AND fldQData.[Q_DATA_VER_NO] = asgnQVer.[FLD_VER_NO] AND asgn.[ASGN_STG_IND] in ('F','PF')  AND asgn.[DL_ASGN] = 1
	  LEFT  JOIN [Census].[CM_Q_DATA_INFO] (NOLOCK) fuQData				ON fuQData.[ASGN_UID]			= asgn.[ASGN_UID] AND fuQData.[Q_DATA_VER_NO] = asgnQVer.[FU_QC_VER_NO] AND asgn.[ASGN_STG_IND] in ('F','PF')  AND asgn.[DL_ASGN] = 1
	  LEFT  JOIN [Census].[CM_REF_ENUM_MDE] (NOLOCK) vaildDatarefEnumMde ON vaildDatarefEnumMde.[EM_CD]	= validQData.[ENUM_MDE] AND vaildDatarefEnumMde.[STS] = 'A'
	  LEFT  JOIN [Census].[CM_Q_DATA_INFO] (NOLOCK) validQDataALL			ON validQDataALL.[ASGN_UID]		= asgn.[ASGN_UID] AND validQDataALL.[Q_DATA_VER_NO] = asgnQVer.[CUR_VER_NO] 
      LEFT  JOIN [Census].[CM_REF_ENUM_MDE] (NOLOCK) vaildDatarefEnumMdeall ON vaildDatarefEnumMdeall.[EM_CD]	= validQDataALL.[ENUM_MDE] AND vaildDatarefEnumMdeall.[STS] = 'A'
	  LEFT  JOIN [Census].[CM_CD_TBL_DTL] (NOLOCK) rfslIndCd			ON rfslIndCd.[CD_TYP]			= @rfslIndStr AND rfslIndCd.[CD_VAL] = asgn.[RFSL_IND] AND rfslIndCd.[STS] = 'A'
	  LEFT  JOIN [Census].[CM_CD_TBL_DTL] (NOLOCK) rfsLvlCd				ON rfsLvlCd.[CD_TYP]			= @rfslLvlStr AND rfsLvlCd.[CD_VAL] = asgn.[RFSL_LVL] AND rfsLvlCd.[STS] = 'A'
	  LEFT  JOIN [Census].[CM_CD_TBL_DTL] (NOLOCK) bldgMgt				ON bldgMgt.[CD_TYP]				= @bldgMgtStr AND bldgMgt.[CD_VAL] = bldg.[BLDG_MGT] AND bldgMgt.[STS] = 'A'
	  LEFT  JOIN [Census].[CM_CD_TBL_DTL] (NOLOCK) pstlIndCd			ON pstlIndCd.[CD_TYP]			= @pstlIndStr AND pstlIndCd.[CD_VAL] = qtr.[PSTL_IND]  AND pstlIndCd.[STS] = 'A'
	  LEFT  JOIN [Census].[CM_CD_TBL_DTL] (NOLOCK) ocpIndCd				ON ocpIndCd.[CD_TYP]			= @ocpIndStr AND ocpIndCd.[CD_VAL] = asgn.[OCP_IND] AND ocpIndCd.[STS] = 'A'
	  LEFT  JOIN #LatestQuestionnaireVersion (NOLOCK) latestQData		ON latestQData.[ASGN_UID]		= asgn.[ASGN_UID]
	  LEFT  JOIN #AssignmentApprovalRequest (NOLOCK) latAsgnAprvReq		ON latAsgnAprvReq.[ASGN_UID]	= asgn.[ASGN_UID]
	  LEFT  JOIN [Census].[CM_ASGN_APRV_REQ] (NOLOCK) asgnAprvReq		ON asgnAprvReq.[ASGN_UID]		= latAsgnAprvReq.[ASGN_UID] AND asgnAprvReq.[APRV_REQ_UID] = latAsgnAprvReq.[APRV_REQ_UID]
	  LEFT  JOIN [Census].[CM_CD_TBL_DTL] (NOLOCK) aprvStsCd			ON aprvStsCd.[CD_TYP]			= @AprvStsStr AND aprvStsCd.[CD_VAL] = asgnAprvReq.[APRV_STS] AND aprvStsCd.[STS] = 'A'
	  --LEFT  JOIN #OtherAsgnJsonString (NOLOCK) othAsgn					ON othAsgn.[ASGN_UID]			= asgn.[ASGN_UID]
	  --LEFT  JOIN #AssignmentDetailJsonString (NOLOCK) asgnDtl			ON asgnDtl.[ASGN_UID]			= asgn.[ASGN_UID]
	  --LEFT  JOIN #InterviewLogJsonString (NOLOCK) intvLogJson			ON intvLogJson.[ASGN_UID]		= asgn.[ASGN_UID]
	  --LEFT  JOIN #AppointmentBookingJsonString (NOLOCK) apptBk			ON apptBk.[ASGN_UID]			= asgn.[ASGN_UID]
	  --LEFT  JOIN #ContactJsonString (NOLOCK) cont						ON cont.[ASGN_UID]				= asgn.[ASGN_UID]
	  --LEFT  JOIN #EnquiryLogJsonString (NOLOCK) enqLog					ON enqLog.[ASGN_UID]			= asgn.[ASGN_UID]
	  --LEFT  JOIN #ItineraryPlanJsonString (NOLOCK) itinPlan				ON itinPlan.[ASGN_UID]			= asgn.[ASGN_UID]
	  --LEFT  JOIN #ActivitiesJsonString (NOLOCK) acty					ON acty.[ASGN_UID]				= asgn.[ASGN_UID]
	  --LEFT  JOIN #EFieldCardJsonString (NOLOCK) efc						ON efc.[ASGN_UID]				= asgn.[ASGN_UID]
	  --LEFT  JOIN #QuestionnaireVersion (NOLOCK) qVer					ON qVer.[ASGN_UID]				= asgn.[ASGN_UID]
	  LEFT  JOIN #latestAppointment (NOLOCK) lstAppt					ON lstAppt.[ASGN_UID]			= asgn.[ASGN_UID]
	  LEFT  JOIN [Census].[CM_APPT] (NOLOCK) appt						ON appt.[APPT_UID]				= lstAppt.[APPT_UID]
	  LEFT  JOIN #latestInterviewLog (NOLOCK) lstIntvLog				ON lstIntvLog.[ASGN_UID]		= asgn.[ASGN_UID]
	  LEFT  JOIN [Census].[CM_INTV_LOG] (NOLOCK) intvLog				ON intvLog.[INTV_LOG_UID]		= lstIntvLog.[INTV_LOG_UID]
	  --LEFT  JOIN [Census].[CM_ASGN_HH_CONT] (NOLOCK)	lstAsgnHhCont	ON lstAsgnHhCont.[HH_CONT_UID]	= intvLog.[HH_CONT_UID]
	  LEFT	JOIN [Census].[CM_ASGN_OQ_ACCT] (NOLOCK) asgnOQAcct			ON asgnOQAcct.[ASGN_UID]		= asgn.[ASGN_UID]
	  LEFT JOIN [Census].[DC_DL_REC] dlRec (NOLOCK)						ON asgn.ASGN_UID = dlRec.ASGN_UID AND @pStaffPostionUid = dlRec.STF_POSN_UID -- #536 add download indicator
	  LEFT JOIN [Census].[CM_ASGN_MAIN] prevRound (NOLOCK)				ON asgn.PREV_ASGN_UID = prevRound.ASGN_UID	--#684 added LT_RD_IND
	  LEFT JOIN [Census].[CM_Q_DATA_PREF] qDataPref (NOLOCK)			ON qDataPref.ASGN_UID = asgn.[ASGN_UID] AND qDataPref.FLD_NAME = 'FSQ_JSON_CONTENT'
      LEFT JOIN (
		SELECT DISTINCT main.ASGN_UID
		FROM Census.CM_ASGN_MAIN main (NOLOCK)
		INNER JOIN Census.CM_ASGN_HH_CONT hhc (NOLOCK) ON hhc.ASGN_UID = main.ASGN_UID
		WHERE hhc.LINK_ID IN (
			SELECT hhc2.LINK_ID
			FROM Census.CM_ASGN_HH_CONT hhc2 (NOLOCK)
			INNER JOIN Census.CM_ASGN_MAIN main2 (NOLOCK) ON hhc2.ASGN_UID = main2.ASGN_UID
			GROUP BY hhc2.LINK_ID
			HAVING COUNT(DISTINCT main2.ASGN_UID) > 1
		)
	  ) sameRespondent ON sameRespondent.ASGN_UID = asgn.ASGN_UID
      OUTER APPLY(
	   SELECT TOP 1 * 
	   FROM [Census].[CM_ASGN_HH_CONT] (NOLOCK)
	   WHERE 
		   [ASGN_UID] = asgn.[ASGN_UID] 
		   AND [DFLT_CONT_IND] = 'N'
		   AND [STS] = 'A'
	   ORDER BY
		   [VER_NO] DESC,
		   [UPD_DT] DESC
	  )lstAsgnHhCont
	  OUTER APPLY(
	   SELECT TOP 1 * 
	   FROM [Census].[CM_ASGN_HH_CONT] (NOLOCK)
	   WHERE 
		   [ASGN_UID] = asgn.[ASGN_UID] 
		   AND [DFLT_CONT_IND] = 'Y'
		   AND [STS] = 'A'
	   ORDER BY
		   [VER_NO] DESC,
		   [UPD_DT] DESC
	  )lstDfltAsgnHhCont
	  LEFT JOIN (
		SELECT CM_ASGN_RMKS.ASGN_UID, COUNT(1) NO_OF_RMK
		FROM Census.CM_ASGN_RMKS WITH (NOLOCK) 
		WHERE STS = 'A'
		GROUP BY CM_ASGN_RMKS.ASGN_UID
	) asgnRmks ON asgnRmks.ASGN_UID = asgn.ASGN_UID
	OUTER APPLY(
		SELECT TOP (1) ASGN_UID
		FROM Census.CM_Q_DATA_INFO
		WHERE ASGN_UID = asgn.ASGN_UID AND RVW_STS = 'P'
	) reviewQData
	  LEFT  JOIN #SketchMap	SketchMap						ON SketchMap.[ASGN_UID]			= asgn.[ASGN_UID]
	  --LEFT  JOIN #SegmentMapCoord SegmentMapCoord				ON SegmentMapCoord.[ASGN_UID]	= asgn.[ASGN_UID]
	  --LEFT  JOIN #adminDataPreFill (NOLOCK) adminDataPreFill			ON adminDataPreFill.[ASGN_UID]  = asgn.[ASGN_UID]
	  LEFT  JOIN #oqRegDt oqRegDt								ON oqRegDt.[ASGN_UID]			= asgn.[ASGN_UID]
	  --LEFT  JOIN #supSurvey (NOLOCK) supSurvey							ON supSurvey.[ASGN_UID]			= asgn.[ASGN_UID]
	  LEFT  JOIN [Census].[CM_Q_DATA_INFO] (NOLOCK) indrQDataInfo		ON indrQDataInfo.[ASGN_UID] = asgnQVer.[ASGN_UID] AND asgnQVer.[INDR_VER_NO] = indrQDataInfo.[Q_DATA_VER_NO]
	  --LEFT  JOIN #QuestionniareImages (NOLOCK) images					ON images.[ASGN_UID] = asgn.[ASGN_UID]
	  LEFT  JOIN (select row_number() over(partition by asgn_uid order by ASGN_UID ASC) RowNum,* from #VIEW_ASGN_ALLOC_HIST 	)	ASGN_ALLOC_HIST		ON ASGN_ALLOC_HIST.ASGN_UID = asgn.[ASGN_UID] and ASGN_ALLOC_HIST.RowNum=1 -- Mantis 2519
	  --LEFT  JOIN #lastRoundRmks											ON #lastRoundRmks.[ASGN_UID] = asgn.[ASGN_UID]
	  LEFT  JOIN #lastRoundRmks	ON #lastRoundRmks.[ASGN_UID] = asgn.[PREV_ASGN_UID]
	  LEFT  JOIN [Census].[FM_BLDG] fmBldg (NOLOCK) 								ON fmBldg.[BLDG_SERL] = bldg.[BLDG_SERL]
	  LEFT  JOIN [Census].[FM_OFCE_MAGNT_BLDG_LIST] ofceMagnt (NOLOCK)			ON ofceMagnt.[FM_BLDG_UID] = fmBldg.[FM_BLDG_UID] AND ofceMagnt.[STS] = 'A' AND ofceMagnt.MAGNT_TYPE = 'INCLUDE'
	  LEFT  JOIN [Census].[FM_BLDG_MAGNT_OFCE] bldgMagntOfce (NOLOCK)			ON bldgMagntOfce.[BLDG_MAGNT_OFCE_UID] = ofceMagnt.[BLDG_MAGNT_OFCE_UID]
	  LEFT  JOIN [Census].[CM_REF_BLDG_TYP] refBldgTyp (NOLOCK)					ON refBldgTyp.[BLDG_TYP] = bldg.[BLDG_TYP]
	  LEFT  JOIN [Census].[CM_REF_QTR_TYP] refQtrTyp (NOLOCK)					ON refQtrTyp.[QTR_TYP_CD] = qtr.[QTR_TYP]
	  --LEFT  JOIN #tempQcLog												ON #tempQcLog.[ASGN_UID] = asgn.[ASGN_UID]
	  LEFT  JOIN [Census].[CM_SRVY_ENUM_RSLT] enumRsltCd (NOLOCK)				ON enumRsltCd.[RSLT_CD] = asgn.[ENUM_RSLT_CD] AND enumRsltCd.[SRVY_UID] = sc.[SRVY_UID] AND enumRsltCd.[STS] = 'A'
	  OPTION(OPTIMIZE FOR UNKNOWN);

	IF @pAssignmentGuid IS NULL AND @pPageNum <> -1
	BEGIN

		SELECT 
			   @pTotalOs = SUM(CASE WHEN([FLD_OS_IND] = 'Y') THEN 1 ELSE 0 END),
			   @pTotalHld = SUM(CASE WHEN([HLD_STS] = 'H') THEN 1 ELSE 0 END)
			   ,@pTotalCount = Count(1)
		FROM #assignmentCountResult

		set @pTotalPage= ceiling(cast(@pTotalCount as decimal(38, 2))/@pPageSize)

	END

	DROP TABLE IF EXISTS #LatestQuestionnaireVersion
	DROP TABLE IF EXISTS #AssignmentApprovalRequest
	DROP TABLE IF EXISTS #OtherAsgnJsonString
	DROP TABLE IF EXISTS #AssignmentDetailJsonString
	DROP TABLE IF EXISTS #InterviewLogJsonString
	DROP TABLE IF EXISTS #AppointmentBookingJsonString
	DROP TABLE IF EXISTS #ContactJsonString
	DROP TABLE IF EXISTS #EnquiryLogJsonString
	DROP TABLE IF EXISTS #OtherAsgnJsonString
	DROP TABLE IF EXISTS #ItineraryPlanJsonString
	DROP TABLE IF EXISTS #ActivitiesJsonString
	DROP TABLE IF EXISTS #EFieldCardJsonString
	DROP TABLE IF EXISTS #QuestionnaireVersion
	DROP TABLE IF EXISTS #latestAppointment
	DROP TABLE IF EXISTS #latestInterviewLog
	DROP TABLE IF EXISTS #cursoryCheckList
	DROP TABLE IF EXISTS #inDepthCheckList
	DROP TABLE IF EXISTS #firstStageCheckList
	DROP TABLE IF EXISTS #secondStageCheckList
	DROP TABLE IF EXISTS #SketchMap
	DROP TABLE IF EXISTS #SegmentMapCoord
	DROP TABLE IF EXISTS #adminDataPreFill
	DROP TABLE IF EXISTS #oqRegDt
	DROP TABLE IF EXISTS #enqlogStatus
	DROP TABLE IF EXISTS #followUpStatus
	DROP TABLE IF EXISTS #maxDateAppointment
	DROP TABLE IF EXISTS #tempOrgUnitList
	DROP TABLE IF EXISTS #orgUnit
	DROP TABLE IF EXISTS #asgnResult
	DROP TABLE IF EXISTS #assignmentList
	DROP TABLE IF EXISTS #tempAssignmentList
	DROP TABLE IF EXISTS #tempAssignmentListVwScp
	DROP TABLE IF EXISTS #assignmentCountResult
	DROP TABLE IF EXISTS #result
	DROP TABLE IF EXISTS #assignmentsGroup
	DROP TABLE IF EXISTS #assignments
	DROP TABLE IF EXISTS #Officer
	DROP TABLE IF EXISTS #Remarks
	DROP TABLE IF EXISTS #Supervisor
	DROP TABLE IF EXISTS #InterviewLogImage
	DROP TABLE IF EXISTS #supSurvey
	DROP TABLE IF EXISTS #QuestionniareImages
	DROP TABLE IF EXISTS #VIEW_ASGN_ALLOC_HIST
	DROP TABLE IF EXISTS #lastRoundRmks
	DROP TABLE IF EXISTS #tempQcLog
	DROP TABLE IF EXISTS #searchResult
	DROP TABLE IF EXISTS #tempQcInd
	DROP TABLE IF EXISTS #maxHHandATT
END
